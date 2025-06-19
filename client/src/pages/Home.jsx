import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaPen, FaUsers, FaComment, FaArrowRight, FaBookOpen, FaBrain, FaEdit, FaSearch } from 'react-icons/fa';
import BlogList from '../components/BlogList';
import AuthContext from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  
  return (
    <>
      {/* Hero Section - Show different content based on authentication */}
      <div className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              {isAuthenticated ? (
                <>
                  <h1>
                    <span className="block text-sm font-ui font-semibold tracking-wide text-indigo-600 uppercase">Welcome back</span>
                    <span className="mt-1 block font-heading text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                      <span className="block text-gray-800">Hello, {user?.name?.split(' ')[0]}</span>
                      <span className="block text-indigo-600">What's on your mind?</span>
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl font-ui">
                    Continue your writing journey or explore new content from our community of writers.
                  </p>
                  <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <Link to="/blogs/create" className="font-ui inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200">
                        Write a Blog
                        <FaEdit className="ml-2" />
                      </Link>
                      <Link to="/blogs" className="font-ui inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-base font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 transition-all duration-200">
                        <FaSearch className="mr-2" />
                        Explore Blogs
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1>
                    <span className="block text-sm font-ui font-semibold tracking-wide text-indigo-600 uppercase">Share your thoughts</span>
                    <span className="mt-1 block font-heading text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                      <span className="block text-gray-800">Ideas Worth</span>
                      <span className="block text-indigo-600">Sharing</span>
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl font-ui">
                    A platform for students and creative minds to share thoughts, experiences, and knowledge through engaging blog posts.
                  </p>
                  <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                      <Link to="/register" className="font-ui inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200">
                        Get Started
                        <FaArrowRight className="ml-2" />
                      </Link>
                      <Link to="/login" className="font-ui inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-base font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 transition-all duration-200">
                        Sign In
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <img 
                    className="w-full" 
                    src={isAuthenticated 
                      ? "https://images.unsplash.com/photo-1542435503-956c469947f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80" 
                      : "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"}
                    alt={isAuthenticated ? "Writing inspiration" : "Writer at work"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section - Show only to non-authenticated users */}
      {!isAuthenticated && (
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="font-ui text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 font-heading text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to express yourself
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto font-ui">
                Our platform provides all the tools you need to create, share, and engage with content.
              </p>
            </div>

            <div className="mt-12">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-md shadow-lg">
                          <FaPen className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 font-heading text-lg font-medium text-gray-900 tracking-tight">Write Your Stories</h3>
                      <p className="mt-5 font-ui text-base text-gray-500">
                        Share your knowledge, experiences, and perspectives with our easy-to-use writing tools and rich text editor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-md shadow-lg">
                          <FaUsers className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 font-heading text-lg font-medium text-gray-900 tracking-tight">Connect with Others</h3>
                      <p className="mt-5 font-ui text-base text-gray-500">
                        Build your audience and connect with friends and people interested in your content from around the world.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-md shadow-lg">
                          <FaComment className="h-6 w-6 text-white" />
                        </span>
                      </div>
                      <h3 className="mt-8 font-heading text-lg font-medium text-gray-900 tracking-tight">Engage in Discussions</h3>
                      <p className="mt-5 font-ui text-base text-gray-500">
                        Participate in meaningful conversations with readers and writers through comments and reactions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Blogs Section */}
      <div className={isAuthenticated ? "py-12" : "bg-gray-50 py-12"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-gray-900">
              {isAuthenticated ? "Blogs For You" : "Recent Blog Posts"}
            </h2>
            <p className="mt-4 text-lg text-gray-500 font-ui">
              {isAuthenticated ? "Discover content tailored to your interests" : "Discover interesting articles from our community"}
            </p>
          </div>
          
          <BlogList />
          
          <div className="text-center mt-12">
            <Link to="/blogs" className="font-ui inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              View All Blogs
            </Link>
          </div>
        </div>
      </div>
      
      {/* CTA Section - Only show to non-authenticated users */}
      {!isAuthenticated && (
        <div className="py-16">
          <div className="relative bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-xl shadow-xl overflow-hidden px-8 py-12">
            <div className="absolute inset-0 opacity-20">
              <svg className="h-full w-full" fill="none">
                <defs>
                  <pattern id="pattern" width="32" height="32" patternUnits="userSpaceOnUse" x="50%" y="0" patternTransform="translate(0, 0)">
                    <path d="M0 32V.5H32" fill="none" stroke="currentColor"></path>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#pattern)" />
              </svg>
            </div>
            
            <div className="relative max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-3xl font-extrabold text-white sm:text-4xl">
                Ready to start your blogging journey?
              </h2>
              <p className="mt-6 text-xl text-indigo-100 font-ui">
                Join our community today and start sharing your stories with readers around the world.
              </p>
              <div className="mt-8 flex justify-center">
                <Link to="/register" className="font-ui px-8 py-3 text-base font-medium rounded-md text-indigo-900 bg-white hover:bg-gray-50 transition-all duration-200 shadow-md">
                  Create an Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Alternative CTA for authenticated users */}
      {isAuthenticated && (
        <div className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-50 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-8 sm:p-10 sm:pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-heading leading-tight font-bold text-gray-900">
                      Have something to share?
                    </h3>
                    <p className="mt-2 text-base font-ui text-gray-500">
                      Your unique perspective matters. Write a blog post and share your knowledge with our community.
                    </p>
                  </div>
                  <div className="flex justify-center md:justify-end">
                    <Link
                      to="/blogs/create"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
                    >
                      <FaPen className="mr-2" />
                      Create a New Blog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home; 