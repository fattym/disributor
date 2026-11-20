import UserManagement from '@/components/admin/UserManagement';

const validTypes = ['customers', 'sellers', 'teachers', 'school-accounts', 'administrators'];

export async function generateStaticParams() {
  return validTypes.map((type) => ({ type }));
}

// Next 16: `params` is a Promise and must be awaited.
export default async function UserTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const activeType = validTypes.includes(type) ? type : 'all';
  return <UserManagement activeType={activeType} />;
}
