import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import FileUploader, { FileList } from '@/app/components/FileUploader';

export default async function ContingencyDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  const { data: contingency } = await supabase
    .from('contingencies')
    .select('*, organization:organizations(*)')
    .eq('id', params.id)
    .single();

  if (!contingency) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {contingency.title}
      </h1>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Archivos adjuntos</h2>
        <FileUploader
          contingencyId={params.id}
          organizationId={contingency.organization_id}
          userId={session.user.id}
        />
        <div className="mt-4">
          <FileList contingencyId={params.id} />
        </div>
      </div>
    </div>
  );
} 