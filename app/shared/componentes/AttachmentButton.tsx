import React, { useRef } from 'react';

interface AttachmentButtonProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes: string;
}

export const AttachmentButton: React.FC<AttachmentButtonProps> = ({
  onFileSelect,
  acceptedFileTypes
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="attachment-button">
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button 
        type="button"
        onClick={handleClick}
        className="btn btn-circle btn-sm btn-ghost"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
          />
        </svg>
      </button>
    </div>
  );
}; 
