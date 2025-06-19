import { useState, useContext, useEffect } from 'react';
import { commentAPI, getImageUrl, getInitials } from '../utils/api';
import AuthContext from '../context/AuthContext';
import { FaReply, FaThumbsUp, FaRegThumbsUp, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import CommentItem from './CommentItem';

const CommentSection = ({ blogId, comments: initialComments, addComment, refreshComments }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState(initialComments || []);
  
  // Sync local comments state with parent component's comments
  useEffect(() => {
    console.log('Updating local comments from parent:', initialComments?.length);
    setLocalComments(initialComments || []);
  }, [initialComments]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      toast.info('Posting comment...', { autoClose: false, toastId: 'addComment' });
      
      const response = await commentAPI.create(blogId, { content: newComment });
      
      if (response.data.success) {
        const commentData = response.data.data;
        
        // Add the new comment to the list
        addComment(commentData);
        setNewComment('');
        toast.dismiss('addComment');
        toast.success('Comment added successfully');
        
        // Refresh comments to ensure everything is up to date
        refreshComments();
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (err) {
      toast.dismiss('addComment');
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };
  
  const handleDelete = async (commentId) => {
    // First find the comment to check ownership
    const comment = localComments.find(c => c._id === commentId) || 
                    localComments.flatMap(c => c.replies || []).find(r => r._id === commentId);
    
    if (!comment) {
      toast.error('Comment not found');
      return;
    }
    
    // Check if user is authorized
    const isAuthor = user && comment.user?._id === user.id;
    const isAdmin = user?.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      toast.error('You are not authorized to delete this comment');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        // Show loading indicator
        toast.info('Deleting comment...', { autoClose: false, toastId: 'deleteComment' });
        
        console.log('Deleting comment:', commentId);
        
        // Delete the comment through the API
        const response = await commentAPI.delete(commentId);
        
        console.log('Delete response:', response.data);
        
        if (response && response.data && response.data.success) {
          toast.dismiss('deleteComment');
          toast.success('Comment deleted successfully');
          
          // Immediately update local state to remove the deleted comment
          setLocalComments(prevComments => {
            // First filter out the comment if it's at the top level
            const filteredComments = prevComments.filter(c => c._id !== commentId);
            
            // Then also filter out the comment from any replies arrays
            return filteredComments.map(c => {
              if (c.replies && c.replies.length > 0) {
                return {
                  ...c,
                  replies: c.replies.filter(r => r._id !== commentId)
                };
              }
              return c;
            });
          });
          
          // Force a refresh in the parent component
          refreshComments();
          
          // Do another refresh after a delay to ensure everything is in sync
          setTimeout(() => {
            console.log('Performing delayed refresh after delete');
            refreshComments();
          }, 1000);
        } else {
          throw new Error('Failed to delete comment');
        }
      } catch (err) {
        toast.dismiss('deleteComment');
        if (err.response?.status === 401) {
          toast.error('You are not authorized to delete this comment');
        } else {
          toast.error('Failed to delete comment: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        }
        console.error('Error deleting comment:', err);
      }
    }
  };
  
  const handleReply = async (parentId, content) => {
    try {
      // Show loading indicator
      toast.info('Sending reply...', { autoClose: false, toastId: 'replyComment' });
      
      console.log('Creating reply to comment:', parentId);
      
      // Make API call to create the reply
      const response = await commentAPI.create(blogId, { 
        content,
        parent: parentId
      });
      
      // Ensure response contains the data we need
      if (response && response.data && response.data.success) {
        toast.dismiss('replyComment');
        toast.success('Reply added successfully');
        
        // Update local state - find the parent comment and add this reply to it
        const newReply = response.data.data;
        
        if (newReply) {
          console.log('New reply created:', JSON.stringify(newReply));
          
          // Add temporary reply to local state
          setLocalComments(prevComments => {
            return prevComments.map(comment => {
              // If this is the parent comment, add the reply
              if (comment._id === parentId) {
                console.log('Adding reply to parent comment:', comment._id);
                const updatedReplies = [...(comment.replies || []), newReply];
                console.log('Updated replies count:', updatedReplies.length);
                return {
                  ...comment,
                  replies: updatedReplies
                };
              }
              return comment;
            });
          });
        }
        
        // Force an immediate refresh
        refreshComments();
        
        // And another delayed refresh to ensure the server has processed everything
        setTimeout(() => {
          console.log('Performing delayed comment refresh...');
          refreshComments();
        }, 1000);
        
        return response;
      } else {
        throw new Error('Failed to add reply');
      }
    } catch (err) {
      toast.dismiss('replyComment');
      console.error('Error replying to comment:', err);
      toast.error('Failed to reply to comment: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      throw err;
    }
  };
  
  const topLevelComments = localComments.filter(comment => !comment.parent);
  const replyCount = localComments.length - topLevelComments.length;
  
  return (
    <div className="my-6">
      <h3 className="font-heading text-2xl font-bold text-gray-800 mb-6">Comments ({localComments.length})</h3>
      
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex space-x-3">
            <img 
              src={getImageUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${getInitials(user?.name)}&background=6366f1&color=fff&size=128&bold=true`} 
              alt={user?.name || 'User'} 
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${getInitials(user?.name || 'U')}&background=6366f1&color=fff&size=128&bold=true`;
              }}
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="form-input w-full text-sm min-h-[100px] resize-none"
                placeholder="Add a comment..."
                required
              />
              <div className="flex justify-end mt-3">
                <button 
                  type="submit"
                  className="font-ui bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all duration-200 text-sm"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-600 mb-2">Please sign in to join the conversation</p>
          <a href="/login" className="font-ui text-indigo-600 hover:text-indigo-800 font-medium">
            Sign In
          </a>
        </div>
      )}
      
      <div className="space-y-5">
        {localComments.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {topLevelComments.length} top-level comments | {replyCount} replies
            </p>
            {topLevelComments.map((comment) => (
              <CommentItem 
                key={comment._id} 
                comment={comment} 
                onDelete={handleDelete}
                currentUser={user}
                onReply={handleReply}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 