import UserManagement from '@/components/admin/UserManagement';

const validTypes = ['customers', 'sellers', 'teachers', 'school-accounts', 'administrators'];

export default function UserTypePage({ params }: { params: { type: string } }) {
  const { type } = params;
  const activeType = validTypes.includes(type) ? type : 'all';
  return <UserManagement activeType={activeType} />;
}
