import { AI_MODES } from '../../utils/constants';

export default function ModeSelector({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {AI_MODES.map(mode => (
        <button
          key={mode.key}
          onClick={() => onSelect(mode.key)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium 
            whitespace-nowrap transition-all duration-200
            ${selected === mode.key 
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25' 
              : 'bg-gray-100 dark:bg-dark-500 text-gray-600 dark:text-dark-100 hover:bg-gray-200 dark:hover:bg-dark-400'
            }
          `}
          title={mode.desc}
        >
          <span>{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}