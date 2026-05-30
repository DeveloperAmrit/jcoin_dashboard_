import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
          J
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">J-Coins Platform</h1>
          <p className="text-slate-500 mt-2">Choose your portal to sign in.</p>
        </div>

        <div className="space-y-4 pt-4">
          <Link 
            href="/admin" 
            className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all group"
          >
            <div className="text-left">
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">Admin Portal</h3>
              <p className="text-sm text-slate-500 group-hover:text-blue-600">Manage rules & monitor</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link 
            href="/company" 
            className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
          >
            <div className="text-left">
              <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700">Company Portal</h3>
              <p className="text-sm text-slate-500 group-hover:text-emerald-600">Submit MoU & track coins</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-600 flex items-center justify-center transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
