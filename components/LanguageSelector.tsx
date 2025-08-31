
import React from 'react';
import { TARGET_LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="language" className="block text-sm font-medium text-gray-300">
        Translate To
      </label>
      <div className="relative">
        <select
          id="language"
          name="language"
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="block w-full appearance-none bg-gray-700 border border-gray-600 text-white py-3 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-base"
        >
          {TARGET_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};
