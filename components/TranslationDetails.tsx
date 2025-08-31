import React from 'react';
import { ListBulletIcon } from './icons/ListBulletIcon';

interface TranslationDetailsProps {
  formattedTranslation: string;
}

export const TranslationDetails: React.FC<TranslationDetailsProps> = ({ formattedTranslation }) => {
  return (
    <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 lg:p-8 border border-gray-700 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center">
        <ListBulletIcon className="h-6 w-6 mr-3 text-cyan-400 shrink-0" />
        Translation Document
      </h2>
      <div className="max-h-[400px] overflow-y-auto p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <pre className="whitespace-pre-wrap font-sans text-gray-200 text-base leading-relaxed">
          {formattedTranslation}
        </pre>
      </div>
       <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};
