import { useState, useEffect, useCallback, useMemo } from 'react';
import TabMenu from './components/TabMenu';
import ActionList from './components/ActionList';
import TableView from './components/TableView';
import GanttChart from './components/GanttChart';
import BarChartView from './components/BarChart';
import { Form2Depth } from './components/ItemForm';
import { fetch1DepthItems, fetchAll2DepthItems } from './api/notion';
import './App.css';

function App() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [allItems1Depth, setAllItems1Depth] = useState([]); // 전체 1depth 아이템 (카테고리 추출용)
  const [items1Depth, setItems1Depth] = useState([]);
  const [items2Depth, setItems2Depth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 지연 아이템 상세 팝업
  const [selectedItem, setSelectedItem] = useState(null);

  // 1Depth 아이템에서 고유한 카테고리 목록 추출
  const categories = useMemo(() => {
    const categorySet = new Set();
    allItems1Depth.forEach(item => {
      if (item.category) {
        categorySet.add(item.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [allItems1Depth]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data1, data2] = await Promise.all([
        fetch1DepthItems(), // 전체 1Depth 가져오기 (카테고리 추출용)
        fetchAll2DepthItems()
      ]);
      setAllItems1Depth(data1);
      // 카테고리 필터링
      const filtered1Depth = activeCategory
        ? data1.filter(item => item.category === activeCategory)
        : data1;
      setItems1Depth(filtered1Depth);
      setItems2Depth(data2);
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는데 실패했습니다. 서버 연결을 확인해주세요.');
    }
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  // 카테고리에 맞는 2depth 아이템 필터링
  const filtered2DepthItems = activeCategory
    ? items2Depth.filter(item => {
        const parent = items1Depth.find(p => p.id === item.parentId);
        return parent?.category === activeCategory;
      })
    : items2Depth;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Action Tracker</h1>
        <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
          {loading ? '로딩 중...' : '새로고침'}
        </button>
      </header>

      <TabMenu
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <main className="app-main">
        {error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={handleRefresh}>다시 시도</button>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {activeView === 'list' && (
              <ActionList
                items1Depth={items1Depth}
                items2Depth={filtered2DepthItems}
                onRefresh={handleRefresh}
              />
            )}
            {activeView === 'table' && (
              <TableView
                items1Depth={items1Depth}
                items2Depth={filtered2DepthItems}
                onItemClick={(item) => setSelectedItem(item)}
                activeCategory={activeCategory}
              />
            )}
            {activeView === 'gantt' && (
              <GanttChart
                items1Depth={items1Depth}
                items2Depth={filtered2DepthItems}
              />
            )}
            {activeView === 'chart' && (
              <BarChartView
                items2Depth={filtered2DepthItems}
                onItemClick={(item) => setSelectedItem(item)}
              />
            )}
          </>
        )}
      </main>

      {/* 지연 아이템 상세 팝업 */}
      <Form2Depth
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={() => {
          setSelectedItem(null);
          handleRefresh();
        }}
        editItem={selectedItem}
        items1Depth={items1Depth}
        items2Depth={items2Depth}
      />
    </div>
  );
}

export default App;
