import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-300 font-mono selection:bg-blue-500/30">
      {/* CRT Scanline Effect */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        {/* Terminal Window */}
        <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-sm">
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
              <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="text-xs text-slate-500">
              layerly-cli — 3d-printer-connection — 80x24
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono text-sm sm:text-base">
            <div className="space-y-2">
              <div className="flex gap-2 text-green-500">
                <span>$</span>
                <span className="text-white">connect --printer=&quot;Layerly-Core&quot;</span>
              </div>
              <div className="text-slate-400">
                Connecting to printer... <span className="text-green-500">Connected</span>
              </div>
              <div className="text-slate-400">M115 ; Check Firmware</div>
              <div className="text-slate-300">
                FIRMWARE_NAME: Marlin 2.1.2 (Layerly Edition) SOURCE_CODE_URL: github.com/layerly
                PROTOCOL_VERSION: 1.0
              </div>

              <div className="flex gap-2 text-green-500 pt-4">
                <span>$</span>
                <span className="text-white">
                  load_file --path=&quot;
                  {typeof window !== 'undefined' ? window.location.pathname : '/unknown'}&quot;
                </span>
              </div>
              <div className="text-slate-400">Reading file header... OK</div>
              <div className="text-slate-400">
                Analyzing G-code... <span className="text-yellow-500 animate-pulse">WARNING</span>
              </div>

              <div className="py-4 text-red-500">
                <p>Error: G-code file not found or corrupted.</p>
                <p>Code: 404_PAGE_NOT_FOUND_EXCEPTION</p>
                <p>Location: X:NaN Y:NaN Z:NaN</p>
              </div>

              <div className="border-l-2 border-red-500 bg-red-500/10 p-4 font-bold text-red-400">
                <p className="mb-2">!!! THERMAL RUNAWAY PROTECTION TRIGGERED !!!</p>
                <p className="text-sm font-normal text-red-300/80">It looks like your browser nozzle hit empty space. The page you are looking for may have been moved or deleted.</p>
              </div>

              <div className="pt-6">
                <p className="text-slate-400">Available recovery options:</p>
                <ul className="mt-2 space-y-1 text-blue-400">
                  <li className="flex items-center gap-2">
                    <span>{'>'}</span>
                    <Link href="/" className="hover:underline hover:text-blue-300">
                      M140 S0 ; Cooldown & Return Home (Go to Dashboard)
                    </Link>
                  </li>
                  <li className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <span>{'>'}</span>
                    <span>M999 ; Restart Printer (Refresh Page)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 animate-pulse">
                <span className="text-green-500">$</span>{' '}
                <span className="inline-block w-2 h-4 bg-green-500 align-middle"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-slate-600 font-mono">
          <p>Layerly.cloud System Monitor v2.4.1</p>
          <p>
            Status: <span className="text-red-500">CRITICAL_STOP</span>
          </p>
        </div>
      </div>
    </main>
  );
}
