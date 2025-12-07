import { CATEGORIES } from '../api/notion';
import './TabMenu.css';

function TabMenu({ activeCategory, onCategoryChange, activeView, onViewChange }) {
  return (
    <div className="tab-container">
      <div className="category-tabs">
        <button
          className={`tab-btn ${activeCategory === null ? 'active' : ''}`}
          onClick={() => onCategoryChange(null)}
        >
          전체
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category}
            className={`tab-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="view-tabs">
        <button
          className={`view-btn ${activeView === 'list' ? 'active' : ''}`}
          onClick={() => onViewChange('list')}
        >
          목록
        </button>
        <button
          className={`view-btn ${activeView === 'gantt' ? 'active' : ''}`}
          onClick={() => onViewChange('gantt')}
        >
          간트
        </button>
        <button
          className={`view-btn ${activeView === 'chart' ? 'active' : ''}`}
          onClick={() => onViewChange('chart')}
        >
          통계
        </button>
      </div>
    </div>
  );
}

export default TabMenu;
