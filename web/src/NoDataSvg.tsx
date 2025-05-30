import React from 'react';

const NoDataSvg: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    width="180"
    height="120"
    viewBox="0 0 180 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    aria-label="No data illustration"
  >
    <ellipse cx="90" cy="100" rx="70" ry="12" fill="#F5F5F5" />
    <rect x="40" y="30" width="100" height="50" rx="10" fill="#FFF3E0" stroke="#FF9800" strokeWidth="2" />
    <rect x="55" y="45" width="70" height="10" rx="5" fill="#FFE0B2" />
    <rect x="55" y="60" width="40" height="8" rx="4" fill="#FFE0B2" />
    <circle cx="60" cy="55" r="3" fill="#FF9800" />
    <circle cx="120" cy="55" r="3" fill="#FF9800" />
    <text x="90" y="85" textAnchor="middle" fill="#FF9800" fontSize="15" fontWeight="bold">No Data</text>
  </svg>
);

export default NoDataSvg;
