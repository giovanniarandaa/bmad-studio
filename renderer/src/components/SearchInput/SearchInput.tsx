import React from 'react';
import { Input, InputProps } from '../Input';

export interface SearchInputProps {
  placeholder?: string;
  value: string;
  onSearch: (value: string) => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onSearch,
  className = '',
}) => {
  const handleSearch = (newValue: string) => {
    onSearch(newValue);
  };

  const searchIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  return (
    <Input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={handleSearch}
      icon={searchIcon}
      className={className}
    />
  );
};
