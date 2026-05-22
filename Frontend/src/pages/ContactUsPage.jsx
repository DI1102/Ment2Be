import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/backendConfig';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

// ── Constants ─────────────────────────────────────────────────────────────────
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 1000;

// ── Validators — outside component so never recreated on render ───────────────
const validate = (data) => {
  const errs = {};
  if (!data.name.trim())    errs.name    = 'Name is required.';
  if (!data.email.trim())   errs.email   = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim()))
                            errs.email   = 'Enter a valid email address.';
  if (!data.subject.trim()) errs.subject = 'Subject is required.';
  if (!data.message.trim()) errs.message = 'Message is required.';
  else if (data.message.trim().length < MESSAGE_MIN)
                            errs.message = `Message must be at least ${MESSAGE_MIN} characters.`;
  return errs;
};

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // FIX: touched & errors live as state inside the component — NOT at module scope
  const [touched, setTouched]       = useState({});
  const [errors,  setErrors]        = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null | 'success' | 'error'
  const [serverError,  setServerError]  = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // live-validate the changed field so errors clear as the user types
    setErrors(prev => ({
      ...prev,
      ...validate({ ...formData, [name]: value })
    }));
  };

  // marks a field as visited the first time the user leaves it
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(validate({ ...formData, [e.target.name]: e.target.value }));
  };

  // FIX: handleSubmit is now a properly defined async function.
  //      validate() + setTouched() are INSIDE it, not at module scope.
  const handleSubmit = async (e) => {
    e.preventDefault();

    // touch all fields so every error becomes visible on first submit attempt
    setTouched({ name: true, email: true, subject: true, message: true });
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return; // stop if invalid

    // FIX: guard prevents double-submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    setServerError('');

    // FIX: safetyTimer created BEFORE try so finally can always clear it
    const safetyTimer = setTimeout(() => setIsSubmitting(false), 10000);

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || 'Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTouched({});
      setErrors({});
      setTimeout(() => setSubmitStatus(null), 4000);

    } catch (error) {
      // FIX: real error message stored and shown, not just a generic flag
      setSubmitStatus('error');
      setServerError(error?.message || 'Something went wrong. Please try again.');
      setTimeout(() => setSubmitStatus(null), 4000);

    } finally {
      // FIX: finally ALWAYS runs — button can NEVER get permanently stuck
      clearTimeout(safetyTimer);
      setIsSubmitting(false);
    }
  };

  // helper — returns className string for an input/textarea
  const inputClass = (field) =>
    `w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-white placeholder-gray-500
     focus:outline-none focus:ring-2 transition-all duration-200 hover:border-gray-500 ${
      touched[field] && errors[field]
        ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20'
        : 'border-gray-700 focus:border-red-400/60 focus:ring-red-400/10'
    }`;

  const remaining = MESSAGE_MAX - formData.message.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0f0f] to-[#0d0d0d] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <LandingNavbar />

        {/* Contact Us Section */}
        <div className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
                Get in Touch
              </h1>
              <p className="text-2xl text-gray-300">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            {/* Contact Form */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8">

              {/* Success banner — above the form */}
              {submitStatus === 'success' && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-3 mb-6 p-4 bg-green-500/10 border border-green-500/25 rounded-lg text-green-400"
                >
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-300">Message sent!</p>
                    <p className="mt-0.5 text-sm text-green-400/70">
                      Thank you! We'll get back to you within 1–2 business days.
                    </p>
                  </div>
                </div>
              )}

              {/* Error banner — above the form */}
              {submitStatus === 'error' && (
                <div
                  role="alert"
                  className="flex items-start gap-3 mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-lg text-red-400"
                >
                  <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-sm">{serverError}</p>
                </div>
              )}

              {/* FIX: noValidate disables browser popups — we handle all validation */}
              <form onSubmit={handleSubmit} noValidate className="space-y-6">

                {/* Name + Email — side by side on sm+ screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-white font-semibold mb-2">
                      Name <span className="text-red-400" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                      aria-invalid={touched.name && !!errors.name ? 'true' : 'false'}
                      aria-describedby={touched.name && errors.name ? 'name-error' : undefined}
                      className={inputClass('name')}
                      placeholder="Your name"
                    />
                    <p
                      id="name-error"
                      role="alert"
                      className={`mt-1.5 text-xs text-red-400 min-h-[1rem] transition-opacity duration-200 ${
                        touched.name && errors.name ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {touched.name && errors.name ? errors.name : ''}
                    </p>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-white font-semibold mb-2">
                      Email <span className="text-red-400" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      aria-required="true"
                      aria-invalid={touched.email && !!errors.email ? 'true' : 'false'}
                      aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                      className={inputClass('email')}
                      placeholder="your@email.com"
                    />
                    <p
                      id="email-error"
                      role="alert"
                      className={`mt-1.5 text-xs text-red-400 min-h-[1rem] transition-opacity duration-200 ${
                        touched.email && errors.email ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {touched.email && errors.email ? errors.email : ''}
                    </p>
                  </div>

                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-white font-semibold mb-2">
                    Subject <span className="text-red-400" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    aria-required="true"
                    aria-invalid={touched.subject && !!errors.subject ? 'true' : 'false'}
                    aria-describedby={touched.subject && errors.subject ? 'subject-error' : undefined}
                    className={inputClass('subject')}
                    placeholder="What is this about?"
                  />
                  <p
                    id="subject-error"
                    role="alert"
                    className={`mt-1.5 text-xs text-red-400 min-h-[1rem] transition-opacity duration-200 ${
                      touched.subject && errors.subject ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {touched.subject && errors.subject ? errors.subject : ''}
                  </p>
                </div>

                {/* Message Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="message" className="block text-white font-semibold">
                      Message <span className="text-red-400" aria-hidden="true">*</span>
                    </label>
                    {/* Character counter */}
                    <span
                      aria-live="polite"
                      className={`text-xs tabular-nums transition-colors duration-200 ${
                        remaining <= 100 ? 'text-orange-400' : 'text-gray-500'
                      }`}
                    >
                      {formData.message.length} / {MESSAGE_MAX}
                    </span>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    maxLength={MESSAGE_MAX}
                    aria-required="true"
                    aria-invalid={touched.message && !!errors.message ? 'true' : 'false'}
                    aria-describedby={touched.message && errors.message ? 'message-error' : undefined}
                    rows="6"
                    className={`${inputClass('message')} resize-none`}
                    placeholder="Tell us more about your inquiry..."
                  />
                  <p
                    id="message-error"
                    role="alert"
                    className={`mt-1.5 text-xs text-red-400 min-h-[1rem] transition-opacity duration-200 ${
                      touched.message && errors.message ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {touched.message && errors.message ? errors.message : ''}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className={`w-full py-3 font-semibold rounded-lg transition-all duration-200
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
                    ${isSubmitting
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-100 active:scale-[0.98] shadow-lg shadow-white/10'
                    }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Sending…
                    </span>
                  ) : 'Send Message'}
                </button>

                {/* Contact Info */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors duration-200">
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <p className="text-gray-400 text-sm">arshchouhan004@gmail.com</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors duration-200">
                    <h3 className="text-white font-semibold mb-1">Phone</h3>
                    <p className="text-gray-400 text-sm">+91 8544758216</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors duration-200">
                    <h3 className="text-white font-semibold mb-1">Location</h3>
                    <p className="text-gray-400 text-sm">Phagwara, India</p>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-600">
                  Fields marked <span className="text-red-400" aria-hidden="true">*</span> are required.
                </p>

              </form>
            </div>
          </div>
        </div>

        <LandingFooter />
      </div>
    </div>
  );
};

export default ContactUsPage;
