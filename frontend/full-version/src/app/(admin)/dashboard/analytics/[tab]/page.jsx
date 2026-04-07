import PropTypes from 'prop-types';
// @next
import { redirect } from 'next/navigation';

export default async function Dashboard({ params }) {
  await params;
  redirect('/dashboard');
}

// Return a list of `params` to populate the [slug] dynamic segment
export async function generateStaticParams() {
  return [];
}

Dashboard.propTypes = { params: PropTypes.object };
