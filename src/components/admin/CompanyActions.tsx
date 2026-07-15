'use client';

import { useState } from 'react';
import { deleteCompany } from '@/app/admin/actions';
import EditCompanyModal from './EditCompanyModal';
import type { Company } from '@/lib/types';

export default function CompanyActions({ company }: { company: Company }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete ${company.name}? This cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteCompany(company.id);
      } catch {
        alert('Failed to delete company');
        setIsDeleting(false);
      }
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <EditCompanyModal company={company} />
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="text-red-500 hover:text-red-700 font-medium text-sm disabled:opacity-50"
      >
        {isDeleting ? '...' : 'Delete'}
      </button>
    </div>
  );
}
