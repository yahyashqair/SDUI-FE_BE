import { useState } from 'react';
import type { SDUITabsComponent, SDUIComponent } from '../../sdui/types';
import { SDUIRenderer } from '../../sdui/renderer';
import { useSDUIContext } from '../../sdui/renderer';

export function Tabs(props: SDUITabsComponent) {
    const [activeTab, setActiveTab] = useState(props.defaultActiveIndex ?? 0);
    const context = useSDUIContext();

    // If items is empty, return null
    if (!props.items || props.items.length === 0) {
        return null;
    }

    const handleTabClick = (index: number) => {
        setActiveTab(index);

        // Optional: emit an action when tab changes
        if (context?.onAction && props.onTabChange) {
            context.onAction(props.onTabChange, props.id);
        }
    };

    return (
        <div className={`sdui-tabs ${props.className || ''}`} style={props.style}>
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                {props.items.map((item, index) => {
                    const isActive = index === activeTab;
                    return (
                        <button
                            key={`${props.id}-tab-${index}`}
                            onClick={() => handleTabClick(index)}
                            className={`
                px-4 py-2 font-medium text-sm focus:outline-none transition-colors duration-200 whitespace-nowrap
                ${isActive
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
                            aria-selected={isActive}
                            role="tab"
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="sdui-tab-content">
                {props.items.map((item, index) => {
                    if (index !== activeTab) return null;

                    return (
                        <div
                            key={`${props.id}-content-${index}`}
                            role="tabpanel"
                            className="animate-fadeIn"
                        >
                            <SDUIRenderer component={item.content} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
