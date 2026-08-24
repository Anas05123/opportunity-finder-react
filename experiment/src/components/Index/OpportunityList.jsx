import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  Bookmark, 
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function OpportunityList({
  opportunities = [],
  selectedId,
  onSelect,
  savedIds = [],
  onToggleSave
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const listTopRef = useRef(null);

  // Reset to page 1 whenever opportunities change (e.g. search/filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [opportunities.length]);

  if (opportunities.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <p style={{ fontSize: '13px' }}>No opportunities match the current query criteria.</p>
      </div>
    );
  }

  // Calculate pagination slice
  const totalItems = opportunities.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentItems = opportunities.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollTop = 0;
    }
  };

  // Generate page numbers window
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Scrollable Items Container */}
      <div ref={listTopRef} className="custom-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {currentItems.map(opp => {
          const isSelected = selectedId === opp.id;
          const isSaved = savedIds.includes(opp.id);
          const orgName = opp.company || opp.organization || 'Corporate Registry';
          const location = opp.location_country ? (opp.location_city ? `${opp.location_city}, ${opp.location_country}` : opp.location_country) : 'Worldwide / Remote';

          return (
            <div
              key={opp.id}
              onClick={() => onSelect(opp)}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-default)',
                background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-surface)'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Header: Org & Save */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {orgName}
                  </span>
                  <CheckCircle size={12} color="var(--success)" title="Verified Official Portal" style={{ flexShrink: 0 }} />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(opp.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isSaved ? 'var(--primary)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex'
                  }}
                  title={isSaved ? 'Remove Bookmark' : 'Save'}
                >
                  <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Title */}
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {opp.title}
              </div>

              {/* Metadata Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', marginTop: '2px' }}>
                <span className="tag tag-blue">
                  {opp.opportunity_type || 'Internship'}
                </span>

                <span className="tag tag-neutral">
                  <MapPin size={10} />
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
                </span>

                {opp.stipend_text && (
                  <span className="tag tag-amber">
                    <DollarSign size={10} />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.stipend_text}</span>
                  </span>
                )}

                {opp.no_ielts === 1 && (
                  <span className="tag tag-green">
                    No IELTS
                  </span>
                )}
              </div>

              {/* Footer Deadline & Match */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} />
                  <span>Cutoff: {opp.deadline_raw || opp.deadline_utc || 'Rolling Admissions'}</span>
                </div>

                {opp.match_score && (
                  <span style={{ fontWeight: '600', color: opp.match_score >= 80 ? 'var(--success)' : 'var(--primary)' }}>
                    {opp.match_score}% Match
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Item Range Info */}
          <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
            Showing <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{startIndex + 1}–{endIndex}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{totalItems}</span>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-icon"
              style={{
                width: '26px',
                height: '26px',
                opacity: currentPage === 1 ? 0.4 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
              title="Previous Page"
            >
              <ChevronLeft size={13} />
            </button>

            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: 'var(--radius-xs)',
                  background: currentPage === pageNum ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                  color: currentPage === pageNum ? '#fff' : 'var(--text-secondary)',
                  border: currentPage === pageNum ? '1px solid var(--primary)' : '1px solid var(--border-default)',
                  fontSize: '11.5px',
                  fontWeight: currentPage === pageNum ? '700' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-icon"
              style={{
                width: '26px',
                height: '26px',
                opacity: currentPage === totalPages ? 0.4 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
              title="Next Page"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
