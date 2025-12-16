import React from 'react';
import './SidebarNav.css';

export interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string;
}

export interface NavSection {
  title?: string;
  itemIds: string[];
}

export interface SidebarNavProps {
  items: NavItem[];
  sections?: NavSection[];
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ items, sections }) => {
  const handleItemClick = (item: NavItem) => {
    if (!item.active) {
      item.onClick();
    }
  };

  const renderItem = (item: NavItem) => {
    const activeClass = item.active ? 'sidebar-nav__item--active' : '';

    return (
      <button
        key={item.id}
        className={`sidebar-nav__item ${activeClass}`.trim()}
        onClick={() => handleItemClick(item)}
      >
        <span className="sidebar-nav__item-icon">{item.icon}</span>
        <span className="sidebar-nav__item-label">{item.label}</span>
        {item.badge && <span className="sidebar-nav__item-badge">{item.badge}</span>}
      </button>
    );
  };

  const renderSection = (section: NavSection, index: number) => {
    const sectionItems = items.filter((item) => section.itemIds.includes(item.id));

    return (
      <div key={`section-${index}`} className="sidebar-nav__section">
        {section.title && <h4 className="sidebar-nav__section-title">{section.title}</h4>}
        <div className="sidebar-nav__items">
          {sectionItems.map((item) => renderItem(item))}
        </div>
      </div>
    );
  };

  if (sections && sections.length > 0) {
    return <nav className="sidebar-nav">{sections.map(renderSection)}</nav>;
  }

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-nav__items">{items.map(renderItem)}</div>
    </nav>
  );
};
