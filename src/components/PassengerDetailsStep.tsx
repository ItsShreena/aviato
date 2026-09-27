/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Mail, ShieldAlert, Phone, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Flight } from '../types';
import BookingFlightSummary from './BookingFlightSummary';

export interface PassengerInfo {
  name: string;
  email: string;
  passportNumber: string;
  phone?: string;
}

interface PassengerDetailsStepProps {
  flight: Flight;
  initialData: PassengerInfo;
  passengersCount?: number;
  onProceed: (data: PassengerInfo) => void;
  onBack: () => void;
}

export default function PassengerDetailsStep({
  flight,
  initialData,
  passengersCount = 1,
  onProceed,
  onBack,
}: PassengerDetailsStepProps) {
  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [passportNumber, setPassportNumber] = useState(initialData.passportNumber || '');
  const [phone, setPhone] = useState(initialData.phone || '');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Passenger name is required.';
    if (trimmed.length < 2) return 'Please enter a valid full passenger name.';
    return null;
  };

  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Please enter a valid email address.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address.';
    return null;
  };

  const validatePassport = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Passport or Gov ID number is required.';
    if (trimmed.length < 5) return 'Passport or Gov ID must be at least 5 alphanumeric characters.';
    return null;
  };

  const validatePhone = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return null; // optional
    if (trimmed.length < 7) return 'Please enter a valid phone number or leave blank.';
    return null;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err: string | null = null;
    if (field === 'name') err = validateName(name);
    else if (field === 'email') err = validateEmail(email);
    else if (field === 'passportNumber') err = validatePassport(passportNumber);
    else if (field === 'phone') err = validatePhone(phone);

    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passportErr = validatePassport(passportNumber);
    const phoneErr = validatePhone(phone);

    const newErrors: { [key: string]: string } = {};
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (passportErr) newErrors.passportNumber = passportErr;
    if (phoneErr) newErrors.phone = phoneErr;

    setErrors(newErrors);
    setTouched({ name: true, email: true, passportNumber: true, phone: true });

    if (Object.keys(newErrors).length > 0) {
      // Focus first error field
      const firstKey = Object.keys(newErrors)[0];
      const element = document.getElementById(`passenger-${firstKey}-input`);
      element?.focus();
      return;
    }

    setIsSubmitting(true);
    onProceed({
      name: name.trim(),
      email: email.trim(),
      passportNumber: passportNumber.trim().toUpperCase(),
      phone: phone.trim(),
    });
  };

  return (
    <div id="passenger-details-step-view" className="space-y-8 select-none">
      {/* Top flight summary */}
      <BookingFlightSummary flight={flight} />

      {/* Main Passenger Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto text-left">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/80">
                Step 2 of 4
              </span>
              {passengersCount > 1 && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Primary Passenger
                </span>
              )}
            </div>
            <h2 className="font-display font-black text-slate-900 text-xl sm:text-2xl tracking-tight mt-1">
              Passenger Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter official traveler credentials matching your government-issued travel identification.
            </p>
          </div>

          {passengersCount > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs text-slate-600 flex items-center gap-2 shrink-0">
              <Info className="h-4 w-4 text-sky-500 shrink-0" />
              <span className="text-[11px] leading-snug">
                <strong>{passengersCount} Passengers</strong> on itinerary. Lead traveler details will be used on the boarding pass.
              </span>
            </div>
          )}
        </div>

        {/* Passenger Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-6" noValidate>
          {/* Multi-passenger indicator banner if applicable */}
          {passengersCount > 1 && (
            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 flex items-center gap-2.5 text-sky-900 text-xs">
              <User className="h-4 w-4 text-sky-600 shrink-0" />
              <div>
                <span className="font-bold">Passenger 1 (Primary / Lead Passenger)</span>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  The primary passenger receives all notifications, booking confirmations, and authoritative boarding pass issuance.
                </p>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="passenger-name-input"
              className="block text-xs font-bold text-slate-700 tracking-wide"
            >
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <div
              className={`flex items-center px-4 py-3 bg-slate-50 border rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 ${
                errors.name && touched.name
                  ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100 bg-rose-50/30'
                  : 'border-slate-200 focus-within:border-sky-500 focus-within:ring-sky-100'
              }`}
            >
              <User className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                id="passenger-name-input"
                type="text"
                required
                aria-required="true"
                aria-invalid={!!(errors.name && touched.name)}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    const err = validateName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: err || '' }));
                  }
                }}
                onBlur={() => handleBlur('name')}
                placeholder="e.g. Alexander Vance"
                className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full placeholder:text-slate-400 placeholder:font-normal"
              />
              {!errors.name && touched.name && name.trim() && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
              )}
            </div>
            {errors.name && touched.name && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="passenger-email-input"
              className="block text-xs font-bold text-slate-700 tracking-wide"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div
              className={`flex items-center px-4 py-3 bg-slate-50 border rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 ${
                errors.email && touched.email
                  ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100 bg-rose-50/30'
                  : 'border-slate-200 focus-within:border-sky-500 focus-within:ring-sky-100'
              }`}
            >
              <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                id="passenger-email-input"
                type="email"
                required
                aria-required="true"
                aria-invalid={!!(errors.email && touched.email)}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    const err = validateEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: err || '' }));
                  }
                }}
                onBlur={() => handleBlur('email')}
                placeholder="e.g. alex.vance@example.com"
                className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full placeholder:text-slate-400 placeholder:font-normal"
              />
              {!errors.email && touched.email && email.trim() && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
              )}
            </div>
            {errors.email && touched.email ? (
              <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.email}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 ml-1">
                Your flight confirmation e-ticket and real-time flight alerts will be sent here.
              </p>
            )}
          </div>

          {/* Grid: Passport ID & Optional Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Passport / Gov ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="passenger-passport-input"
                className="block text-xs font-bold text-slate-700 tracking-wide"
              >
                Passport / Gov ID Number <span className="text-rose-500">*</span>
              </label>
              <div
                className={`flex items-center px-4 py-3 bg-slate-50 border rounded-2xl transition-all focus-within:bg-white focus-within:ring-2 ${
                  errors.passportNumber && touched.passportNumber
                    ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100 bg-rose-50/30'
                    : 'border-slate-200 focus-within:border-sky-500 focus-within:ring-sky-100'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  id="passenger-passport-input"
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid={!!(errors.passportNumber && touched.passportNumber)}
                  value={passportNumber}
                  onChange={(e) => {
                    const upper = e.target.value.toUpperCase();
                    setPassportNumber(upper);
                    if (touched.passportNumber) {
                      const err = validatePassport(upper);
                      setErrors((prev) => ({ ...prev, passportNumber: err || '' }));
                    }
                  }}
                  onBlur={() => handleBlur('passportNumber')}
                  placeholder="e.g. US7748921"
                  className="bg-transparent text-sm font-semibold font-mono text-slate-900 focus:outline-none w-full uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-400"
                />
                {!errors.passportNumber && touched.passportNumber && passportNumber.trim() && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-2" />
                )}
              </div>
              {errors.passportNumber && touched.passportNumber && (
                <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.passportNumber}</span>
                </p>
              )}
            </div>

            {/* Optional Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="passenger-phone-input"
                className="block text-xs font-bold text-slate-700 tracking-wide"
              >
                Mobile Phone <span className="text-slate-400 font-normal">(Optional for SMS alerts)</span>
              </label>
              <div className="flex items-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl transition-all focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-100">
                <Phone className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  id="passenger-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (touched.phone) {
                      const err = validatePhone(e.target.value);
                      setErrors((prev) => ({ ...prev, phone: err || '' }));
                    }
                  }}
                  onBlur={() => handleBlur('phone')}
                  placeholder="e.g. +91 98765 43210"
                  className="bg-transparent text-sm font-semibold text-slate-900 focus:outline-none w-full placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-slate-150 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              id="passenger-back-btn"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Flights</span>
            </button>

            <button
              type="submit"
              id="passenger-proceed-seat-btn"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Seat Selection</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
