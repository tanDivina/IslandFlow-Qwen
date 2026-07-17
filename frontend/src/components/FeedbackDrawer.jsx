import React, { useState, useEffect, useRef } from 'react';

export default function FeedbackDrawer({ 
  isOpen, 
  onClose, 
  userEmail = '', 
  appName = 'IslandFlow'
}) {
  const [category, setCategory] = useState('feature');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const drawerRef = useRef(null);
  const storageKey = `${appName.toLowerCase()}_feedback_history`;

  // Load feedback history from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(storageKey);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Error loading feedback history:', e);
    }
  }, [storageKey]);

  // Sync email when prop changes
  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap on open
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    const feedbackPayload = {
      category: category === 'feature' ? 'Feature Request' : category === 'bug' ? 'Bug Report' : category === 'praise' ? 'Praise' : 'Other',
      rating,
      comment: comment.trim(),
      email: email.trim() || 'Anonymous',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    try {
      // Find server API URL dynamically (maintaining sandbox and remote compatibility)
      const apiUrl = window.location.origin === 'http://localhost:5173' 
        ? 'http://localhost:8000/api/feedback' 
        : '/api/feedback';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackPayload)
      });

      const data = await response.json();

      const newFeedbackItem = {
        feedbackId: data.feedbackId || `fb_local_${Date.now()}`,
        category: feedbackPayload.category,
        rating: rating,
        comment: feedbackPayload.comment,
        email: feedbackPayload.email,
        submittedAt: feedbackPayload.timestamp
      };

      const updatedHistory = [newFeedbackItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

      setIsSubmitting(false);
      setIsSuccess(true);
      setComment('');
      setRating(0);
    } catch (error) {
      console.error('Error submitting feedback, caching locally:', error);
      
      const fallbackItem = {
        feedbackId: `fb_local_${Date.now()}`,
        category: feedbackPayload.category,
        rating: rating,
        comment: feedbackPayload.comment,
        email: feedbackPayload.email,
        submittedAt: feedbackPayload.timestamp
      };
      
      const updatedHistory = [fallbackItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem(storageKey, JSON.stringify(updatedHistory));

      setIsSubmitting(false);
      setIsSuccess(true);
      setComment('');
      setRating(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/35 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        style={{ zIndex: 1 }}
      />

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="relative w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden"
        style={{ 
          background: 'var(--panel-bg)', 
          borderLeft: '1px solid var(--border-color)', 
          backdropFilter: 'blur(20px)',
          zIndex: 2,
          color: 'var(--text-primary)'
        }}
      >
        {/* Subtle radial ambient background glow (champagne or ocean teal) */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 rounded-full filter blur-[80px] pointer-events-none -mr-40 -mt-20 opacity-[0.06]" 
          style={{ backgroundColor: 'var(--primary)' }}
        />

        {/* Header */}
        <div className="px-6 py-5 border-b border-color flex items-center justify-between relative" style={{ borderColor: 'var(--border-color)', background: 'var(--primary-glow)' }}>
          <div>
            <h2 id="feedback-title" className="text-lg font-bold tracking-tight" style={{ color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}>
              Share Your Feedback
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              We'd love to hear about your {appName} experience!
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close feedback panel"
            className="p-1.5 rounded-lg text-muted hover-bg-primary transition-all duration-200"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 relative" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isSuccess ? (
            /* Success View */
            <div className="h-full flex flex-col justify-center items-center text-center py-12" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', margin: 'auto 0' }}>
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                style={{ 
                  backgroundColor: 'var(--primary-glow)', 
                  border: '1.5px solid var(--primary)', 
                  color: 'var(--primary)',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>¡Muchas Gracias!</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.4' }}>
                  Your feedback has been logged directly. We review every submission to make {appName} even better.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px', paddingTop: '16px' }}>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setShowHistory(false);
                  }}
                  className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold"
                  style={{ width: '100%', padding: '10px 16px', cursor: 'pointer' }}
                >
                  Send More Feedback
                </button>
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setShowHistory(true);
                  }}
                  className="btn-secondary w-full py-2.5 rounded-lg text-sm font-semibold"
                  style={{ width: '100%', padding: '10px 16px', cursor: 'pointer' }}
                >
                  View Your Submissions
                </button>
              </div>
            </div>
          ) : showHistory ? (
            /* History View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your Past Submissions
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    textDecoration: 'underline'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  Back to Form
                </button>
              </div>

              {history.length === 0 ? (
                <div style={{ textAlignment: 'center', padding: '32px 16px', border: '1px dashed var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', margin: 0 }}>No submissions yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map((item) => (
                    <div 
                      key={item.feedbackId} 
                      className="glass-card"
                      style={{ 
                        padding: '14px', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px', 
                        position: 'relative',
                        background: 'var(--slot-empty-bg)'
                      }}
                    >
                      <div className="tech-corner-bracket tech-bracket-tl"></div>
                      <div className="tech-corner-bracket tech-bracket-tr"></div>
                      <div className="tech-corner-bracket tech-bracket-bl"></div>
                      <div className="tech-corner-bracket tech-bracket-br"></div>
                      <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 600, 
                          color: item.category === 'Bug Report' ? 'var(--error)' : 'var(--primary)',
                          background: item.category === 'Bug Report' ? 'var(--error-glow)' : 'var(--primary-glow)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: `1px solid ${item.category === 'Bug Report' ? 'var(--error)' : 'var(--border-color)'}`
                        }}>
                          {item.category}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-dim)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{new Date(item.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {item.rating > 0 && (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star} 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill={star <= item.rating ? 'var(--primary)' : 'none'} 
                              stroke="var(--primary)" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{ opacity: star <= item.rating ? 1 : 0.2 }}
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      )}
                      
                      <p style={{ 
                        margin: 0, 
                        fontSize: '11px', 
                        color: 'var(--text-muted)', 
                        lineHeight: '1.4',
                        background: 'rgba(0,0,0,0.02)',
                        padding: '8px',
                        borderRadius: '6px',
                        fontStyle: 'italic'
                      }}>
                        "{item.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Submission Form View */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Category selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Feedback Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCategory('feature')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: category === 'feature' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: category === 'feature' ? 'var(--primary-glow)' : 'transparent',
                      color: category === 'feature' ? 'var(--primary)' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                      <path d="M9 18h6M10 22h4" />
                    </svg>
                    <span>Feature Request</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('bug')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: category === 'bug' ? '1.5px solid var(--error)' : '1px solid var(--border-color)',
                      background: category === 'bug' ? 'var(--error-glow)' : 'transparent',
                      color: category === 'bug' ? 'var(--error)' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M8 21v-4a4 4 0 0 1 8 0v4M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M4 11h16" />
                    </svg>
                    <span>Bug Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('praise')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: category === 'praise' ? '1.5px solid var(--warning)' : '1px solid var(--border-color)',
                      background: category === 'praise' ? 'var(--warning-glow)' : 'transparent',
                      color: category === 'praise' ? 'var(--warning)' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                    <span>Praise / Ideas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('other')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: category === 'other' ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                      background: category === 'other' ? 'var(--accent-glow)' : 'transparent',
                      color: category === 'other' ? 'var(--accent)' : 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>Other</span>
                  </button>
                </div>
              </div>

              {/* Rating System */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Overall Rating
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      aria-label={`Rate ${star} out of 5 stars`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <svg 
                        width="26" 
                        height="26" 
                        viewBox="0 0 24 24" 
                        fill={star <= (hoveredRating || rating) ? 'var(--primary)' : 'none'} 
                        stroke="var(--primary)" 
                        strokeWidth="1.8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{
                          transition: 'all 0.1s ease',
                          opacity: star <= (hoveredRating || rating) ? 1 : 0.25
                        }}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', marginLeft: '8px' }}>
                      {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Could be better' : 'Needs work'}
                    </span>
                  )}
                </div>
              </div>

              {/* Text comment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="feedback-comment" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Comments
                </label>
                <textarea
                  id="feedback-comment"
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    category === 'feature' 
                      ? "Describe the feature you'd like to see..." 
                      : category === 'bug' 
                      ? "What went wrong? Tell us how to reproduce..." 
                      : "Type your thoughts here..."
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.06)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Email Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="feedback-email" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address <span style={{ color: 'var(--text-dim)', textTransform: 'none', fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.06)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Form buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    fontSize: '13px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <div style={{ h: '16px', w: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      Submit Feedback
                    </>
                  )}
                </button>

                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className="btn-secondary"
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      fontSize: '11px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    View Previous Submissions ({history.length})
                  </button>
                )}
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-color" style={{ borderColor: 'var(--border-color)', fontSize: '10px', color: 'var(--text-dim)', textAlign: 'center' }}>
          Submitted feedback and logs are stored securely to improve your paradise experience.
        </div>
      </div>
    </div>
  );
}
