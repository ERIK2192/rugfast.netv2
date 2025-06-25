
import React from 'react';
import { Check, Loader } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface LoadingStepsProps {
  steps: Step[];
}

export const LoadingSteps: React.FC<LoadingStepsProps> = ({ steps }) => {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {step.status === 'loading' && (
              <Loader className="h-5 w-5 text-cyan-400 animate-spin" />
            )}
            {step.status === 'completed' && (
              <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center animate-scale-in">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            {step.status === 'error' && (
              <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
            )}
            {step.status === 'pending' && (
              <div className="h-5 w-5 bg-gray-600 rounded-full" />
            )}
          </div>
          <span className={`text-sm ${
            step.status === 'completed' ? 'text-green-400' :
            step.status === 'loading' ? 'text-cyan-400' :
            step.status === 'error' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
};
