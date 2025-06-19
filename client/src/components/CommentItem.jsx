import { useState } from 'react';
import { commentAPI, getImageUrl, getInitials } from '../utils/api';
import { FaReply, FaThumbsUp, FaRegThumbsUp, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Individual Comment Component
const CommentItem = ({ comment, onDelete, currentUser, onReply }) => {
  const [liked, setLiked] = useState(comment.reactionUsers?.likes?.includes(currentUser?.id));
  const [likesCount, setLikesCount] = useState(comment.reactions?.likes || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const isAuthor = currentUser && comment.user?._id === currentUser.id;
  const isAdmin = currentUser?.role === 'admin';
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleLike = async () => {
    try {
      const response = await commentAPI.like(comment._id);
      if (response.data.success) {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      toast.error('Failed to like comment');
    }
  };
  
  const handleEdit = async () => {
    if (isEditing) {
      try {
        // Call the API to update the comment
        await commentAPI.update(comment._id, { content: editText });
        comment.content = editText;
        setIsEditing(false);
        toast.success('Comment updated');
      } catch (err) {
        console.error('Error updating comment:', err);
        toast.error('Failed to update comment');
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      // Disable the reply button while submitting
      const replyButton = document.getElementById(`reply-button-${comment._id}`);
      if (replyButton) {
        replyButton.disabled = true;
        replyButton.innerText = 'Sending...';
      }
      
      await onReply(comment._id, replyText);
      setReplyText('');
      setIsReplying(false);
    } catch (err) {
      console.error('Error replying to comment:', err);
      toast.error('Failed to reply to comment');
    } finally {
      // Re-enable the reply button after submission (whether success or failure)
      const replyButton = document.getElementById(`reply-button-${comment._id}`);
      if (replyButton) {
        replyButton.disabled = false;
        replyButton.innerText = 'Reply';
      }
    }
  };
  
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-start space-x-3">
        <img 
          src={getImageUrl(comment.user?.avatar) || `https://ui-avatars.com/api/?name=${getInitials(comment.user?.name)}&background=6366f1&color=fff&size=128&bold=true`} 
          alt={comment.user?.name || 'User'} 
          className="w-10 h-10 rounded-full mt-1 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${getInitials(comment.user?.name || 'U')}&background=6366f1&color=fff&size=128&bold=true`;
          }}
        />
        <div className="flex-1 bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-ui font-medium text-gray-800">{comment.user?.name || 'Anonymous'}</h4>
              <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
            </div>
            {/* Only show edit/delete buttons for the comment author or admin */}
            {(isAuthor || isAdmin) && (
              <div className="flex space-x-2">
                <button 
                  onClick={handleEdit}
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                >
                  <FaEdit size={14} />
                </button>
                <button 
                  onClick={() => onDelete(comment._id)}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="form-input w-full text-sm min-h-[80px] resize-none"
                placeholder="Edit your comment..."
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="font-ui text-xs text-gray-600 mr-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEdit} 
                  className="font-ui text-xs bg-indigo-600 text-white px-3 py-1 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
          )}
          
          <div className="flex items-center mt-3 text-xs space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center ${liked ? 'text-indigo-600' : 'text-gray-500'} hover:text-indigo-600 transition-colors`}
            >
              {liked ? <FaThumbsUp className="mr-1" /> : <FaRegThumbsUp className="mr-1" />}
              <span>{likesCount > 0 ? likesCount : ''} Like{likesCount !== 1 ? 's' : ''}</span>
            </button>
            <button 
              onClick={() => setIsReplying(!isReplying)} 
              className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <FaReply className="mr-1" /> Reply
            </button>
          </div>
          
          {isReplying && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="bg-indigo-50 p-3 rounded-md">
                <label className="text-xs font-medium text-indigo-700 mb-2 block">Your reply to {comment.user?.name || 'this comment'}</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="form-input w-full text-sm min-h-[60px] resize-none mb-2 border border-indigo-200 focus:border-indigo-400 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="Write your reply..."
                />
                <div className="flex justify-end">
                  <button 
                    onClick={() => setIsReplying(false)} 
                    className="font-ui text-xs text-gray-600 hover:bg-gray-100 py-1 px-3 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button 
                    id={`reply-button-${comment._id}`}
                    onClick={handleReply} 
                    className="font-ui text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Display replies if any */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 mt-3 space-y-3 border-l-2 border-indigo-100 pl-3">
          <div className="text-xs text-indigo-600 font-medium mb-2 flex items-center bg-indigo-50 p-1.5 rounded-md">
            <FaReply className="mr-1" /> {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
          </div>
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply._id} 
              comment={reply} 
              onDelete={onDelete}
              currentUser={currentUser}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem; 