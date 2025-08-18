// @next
import { redirect } from 'next/navigation';

/***************************  MAIN - DEFAULT PAGE  ***************************/

export default function Home() {
  redirect('/dashboard/analytics/overview');
}
