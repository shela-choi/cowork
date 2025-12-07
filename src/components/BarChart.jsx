import { useMemo, useState } from 'react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './BarChart.css';

// 초록색 톤 - 명도/채도로 구분
const STATUS_COLORS = {
  '완료': '#1a5d1a',      // 진한 초록 (완료)
  '진행 중': '#38a169',   // 중간 초록 (진행 중)
  '검토 중': '#68d391',   // 밝은 초록 (검토 중)
  '아이디어': '#9ae6b4',  // 연한 초록 (아이디어)
  '보류': '#c6f6d5',      // 아주 연한 초록 (보류)
  '대기': '#f0fff4',      // 거의 흰색에 가까운 초록 (대기)
};

const ALL_STATUSES = ['아이디어', '검토 중', '진행 중', '완료', '보류', '대기'];

function BarChartView({ items2Depth, onItemClick }) {
  // 조회기간 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 조회기간 필터 적용된 아이템
  const filteredItems = useMemo(() => {
    if (!startDate && !endDate) return items2Depth;

    return items2Depth.filter(item => {
      const planStart = item.planStartDate;
      if (!planStart) return false; // 계획 시작일이 없으면 제외

      if (startDate && planStart < startDate) return false;
      if (endDate && planStart > endDate) return false;
      return true;
    });
  }, [items2Depth, startDate, endDate]);

  // 담당자별 통계 (모든 상태 표기)
  const assigneeData = useMemo(() => {
    const stats = {};

    filteredItems.forEach(item => {
      item.담당자.forEach(name => {
        if (!stats[name]) {
          stats[name] = { name, total: 0 };
          ALL_STATUSES.forEach(s => stats[name][s] = 0);
        }
        stats[name].total++;
        const status = item.progressStatus || '대기';
        if (stats[name][status] !== undefined) {
          stats[name][status]++;
        }
      });
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [filteredItems]);

  // 상태별 통계
  const statusData = useMemo(() => {
    const stats = {};

    filteredItems.forEach(item => {
      const status = item.progressStatus || '미지정';
      if (!stats[status]) {
        stats[status] = { name: status, count: 0 };
      }
      stats[status].count++;
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [filteredItems]);

  // 지연 아이템 (계획 완료일이 지났는데 완료가 안된 아이템)
  const delayedItems = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return filteredItems.filter(item => {
      // 계획 완료일이 있고, 오늘보다 이전이고, 완료 상태가 아닌 경우
      return item.planEndDate &&
             item.planEndDate < today &&
             item.progressStatus !== '완료';
    }).sort((a, b) => (a.planEndDate || '').localeCompare(b.planEndDate || ''));
  }, [filteredItems]);

  // 전체 요약 통계
  const summary = useMemo(() => {
    const total = filteredItems.length;
    const completed = filteredItems.filter(i => i.progressStatus === '완료').length;
    const inProgress = filteredItems.filter(i => i.progressStatus === '진행 중').length;
    const onHold = filteredItems.filter(i => i.progressStatus === '보류').length;
    const delayed = delayedItems.length;

    return {
      total,
      completed,
      inProgress,
      onHold,
      delayed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [filteredItems, delayedItems]);

  const getStatusColor = (status) => STATUS_COLORS[status] || '#888';

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  // 지연 일수 계산
  const getDelayDays = (planEndDate) => {
    if (!planEndDate) return 0;
    const today = new Date();
    const endDate = new Date(planEndDate);
    const diff = Math.floor((today - endDate) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="chart-container">
      {/* 조회기간 필터 */}
      <div className="filter-section">
        <label>조회기간 (계획 시작일 기준)</label>
        <div className="date-filter">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            placeholder="시작일"
          />
          <span>~</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            placeholder="종료일"
          />
          {(startDate || endDate) && (
            <button
              className="btn-clear"
              onClick={() => { setStartDate(''); setEndDate(''); }}
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-value">{summary.total}</span>
          <span className="card-label">전체 아이템</span>
        </div>
        <div className="summary-card complete">
          <span className="card-value">{summary.completed}</span>
          <span className="card-label">완료</span>
        </div>
        <div className="summary-card progress">
          <span className="card-value">{summary.inProgress}</span>
          <span className="card-label">진행 중</span>
        </div>
        <div className="summary-card hold">
          <span className="card-value">{summary.onHold}</span>
          <span className="card-label">보류</span>
        </div>
        <div className="summary-card delayed">
          <span className="card-value">{summary.delayed}</span>
          <span className="card-label">지연</span>
        </div>
        <div className="summary-card rate">
          <span className="card-value">{summary.completionRate}%</span>
          <span className="card-label">완료율</span>
        </div>
      </div>

      {/* 지연 아이템 목록 */}
      {delayedItems.length > 0 && (
        <div className="delayed-section">
          <h3>지연 아이템 ({delayedItems.length}건)</h3>
          <div className="delayed-list">
            {delayedItems.map(item => (
              <div
                key={item.id}
                className="delayed-item"
                onClick={() => onItemClick && onItemClick(item)}
              >
                <div className="delayed-item-left">
                  <span className="delayed-item-title">{item.title}</span>
                  <span className={`delayed-item-status ${getStatusColor(item.progressStatus)}`}>
                    {item.progressStatus}
                  </span>
                </div>
                <div className="delayed-item-right">
                  <span className="delayed-item-date">
                    계획완료: {formatDate(item.planEndDate)}
                  </span>
                  <span className="delayed-days">
                    {getDelayDays(item.planEndDate)}일 지연
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-grid">
        {/* 담당자별 차트 */}
        <div className="chart-card chart-card-small">
          <h3>담당자별 현황</h3>
          {assigneeData.length === 0 ? (
            <div className="empty-chart">담당자 데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RechartsBar data={assigneeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
                {ALL_STATUSES.map(status => (
                  <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status] || '#888'} />
                ))}
              </RechartsBar>
            </ResponsiveContainer>
          )}
        </div>

        {/* 상태별 파이 차트 */}
        <div className="chart-card chart-card-small">
          <h3>상태별 분포</h3>
          {statusData.length === 0 ? (
            <div className="empty-chart">상태 데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, count }) => `${name} (${count})`}
                  labelLine={{ stroke: 'var(--text-secondary)' }}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={getStatusColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default BarChartView;
