'use client';
import PropTypes from 'prop-types';

export default function AdminAuthGuard({ children }) {
  return children;
}

AdminAuthGuard.propTypes = { children: PropTypes.node };
