"use client";

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  error,
  disabled = false,
  className = ""
}: DropdownProps) {
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-lg font-bold text-gray-700 mb-4">
          {label}
        </label>
      )}
      
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button className={`relative w-full cursor-default rounded-2xl border-2 py-5 pl-8 pr-16 text-left transition-all duration-300 focus:outline-none focus:ring-4 text-xl ${
            error 
              ? 'border-red-300 bg-red-50 focus:ring-red-500/20 focus:border-red-500' 
              : 'border-gray-200 bg-white hover:border-indigo-300 focus:ring-indigo-500/20 focus:border-indigo-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
              <ChevronUpDownIcon
                className="h-6 w-6 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-2 max-h-80 w-full overflow-auto rounded-2xl bg-white py-2 text-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active, selected }) =>
                    `relative cursor-default select-none py-4 pl-12 pr-6 transition-colors duration-150 ${
                      active 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-900' 
                        : 'text-gray-900'
                    } ${
                      option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`
                  }
                  value={option.value}
                  disabled={option.disabled}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-bold' : 'font-medium'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-indigo-600">
                          <CheckIcon className="h-6 w-6" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}