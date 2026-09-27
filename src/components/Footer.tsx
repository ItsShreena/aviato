/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plane, Mail, Send, CheckCircle2, Shield, Heart, Award } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer id="aviato-footer" className="bg-navy-950 text-navy-200 border-t border-navy-900 mt-auto">
      {/* Upper Newsletter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-navy-900">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <h3 className="font-display font-semibold text-lg text-white tracking-tight flex items-center gap-2">
              <Mail className="h-5 w-5 text-sky-400" />
              Subscribe to Route Optimization Alerts
            </h3>
            <p className="text-sm text-navy-400 mt-1 max-w-lg">
              Get notified when flight controllers optimize standard pathways, bringing premium tickets down by up to 35% using Aviato.
            </p>
          </div>
          <div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/60 font-medium text-sm animate-fadeIn">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Locked in! We'll alert you the second prices drop.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your professional email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-navy-900 text-sm text-white placeholder-navy-500 rounded-xl px-4 py-2.5 w-full border border-navy-800 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-navy-950 hover:scale-105 font-bold text-xs tracking-wider uppercase px-4 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Alert Me</span>
                  <Send className="h-3 w-3" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-sky-500 text-navy-950 p-1.5 rounded-lg">
                <Plane className="h-4 w-4 rotate-45" />
              </div>
              <span className="font-display font-black text-white text-lg tracking-wider">AVIATO</span>
            </div>
            <p className="text-xs text-navy-400 leading-relaxed font-light">
              "Fly Smarter. Reach Faster."
              Aviato is an intelligent flight scheduling, booking, and route optimization simulator crafted to demonstrate ultimate frontend precision.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-navy-500 pt-2">
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-sky-500" /> SSL SECURE</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-sky-500" /> EMIRATES STD</span>
            </div>
          </div>

          {/* Col 2: Destinations Mockups */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white tracking-widest uppercase mb-4">Radar Hotspots</h4>
            <ul className="space-y-2 text-xs text-navy-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">New York (JFK) to London (LHR)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Tokyo (HND) to San Francisco (SFO)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Paris (CDG) to Dubai (DXB)</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Singapore (SIN) to Sydney (SYD)</span></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white tracking-widest uppercase mb-4">Engineering Hub</h4>
            <ul className="space-y-2 text-xs text-navy-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">Telemetry Data API</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Carbon Offset Initiative</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Sovereign Wings Partners</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Fleet Specifications</span></li>
            </ul>
          </div>

          {/* Col 4: Corporate Info */}
          <div>
            <h4 className="font-display font-semibold text-sm text-white tracking-widest uppercase mb-4">Core Principles</h4>
            <p className="text-xs text-navy-400 leading-relaxed font-light">
              We operate strictly client-side to ensure state latency stays below 10ms. No microservice boundaries, no slow databases, just pure layout craft.
            </p>
            <div className="mt-4 p-3 bg-navy-900/40 rounded-xl border border-navy-850 flex items-center justify-between text-[11px] text-sky-400 font-mono">
              <span>Operational Status:</span>
              <span className="animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                99.98% OPTIMAL
              </span>
            </div>
          </div>
        </div>

        {/* Lower Banner */}
        <div className="pt-12 mt-12 border-t border-navy-900 flex flex-col md:flex-row justify-between items-center text-xs text-navy-500">
          <p>© 2026 AVIATO Air Transport Technologies. Built with premium layout craft.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Operations</span>
            <span className="hover:text-white cursor-pointer transition-colors">Support Portal</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> for elite travelers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
