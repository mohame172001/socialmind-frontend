import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="text-white font-bold text-xl">SocialMind</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: April 8, 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Introduction</h2>
            <p>
              SocialMind ("we", "our", or "us") provides an AI-powered social media automation platform
              that helps businesses and creators manage automated responses to comments and direct messages
              on Instagram and TikTok. This Privacy Policy explains how we collect, use, and protect
              your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Information We Collect</h2>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white font-medium mb-1">Account Information</div>
                <p>Instagram and TikTok account IDs, usernames, and access tokens you provide to connect your social accounts.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white font-medium mb-1">Social Media Data</div>
                <p>Comments, messages, and interactions from your connected Instagram and TikTok accounts, received via official platform webhooks. This data is processed solely to generate automated responses.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white font-medium mb-1">Configuration Data</div>
                <p>Automation rules, reply templates, and settings you configure within SocialMind.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white font-medium mb-1">Activity Logs</div>
                <p>Records of automated actions taken (replies sent, messages handled) for your review and audit purposes.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>To provide and operate the automation service</li>
              <li>To generate AI-powered responses to comments and messages on your behalf</li>
              <li>To display activity logs and analytics within your dashboard</li>
              <li>To maintain the security and integrity of your connected accounts</li>
              <li>To send automated replies via the Meta Graph API and TikTok API</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Meta / Instagram Data</h2>
            <p className="mb-3">
              When you connect your Instagram account through Meta's API, we receive and process data
              in accordance with Meta's Platform Terms and Developer Policies. Specifically:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>We use <strong className="text-gray-300">instagram_business_manage_messages</strong> and <strong className="text-gray-300">instagram_manage_comments</strong> permissions only to read incoming interactions and send replies on your behalf</li>
              <li>We do not sell, share, or transfer your Instagram data to any third parties</li>
              <li>Access tokens are stored securely and used only to interact with your account</li>
              <li>We do not use your data for advertising or profiling purposes</li>
              <li>You can revoke access at any time from your Instagram account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Data Storage and Security</h2>
            <p className="mb-3">
              Your data is stored in a secure database hosted on Railway infrastructure. We implement
              industry-standard security measures including:
            </p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li>Encrypted storage of access tokens</li>
              <li>HTTPS encryption for all data in transit</li>
              <li>No third-party access to your social media credentials</li>
              <li>Regular security reviews of our infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. Activity logs are retained
              for up to 90 days. When you delete an account or disconnect a social platform, the
              associated access tokens and automation rules are deleted immediately. You can request
              full data deletion at any time (see Section 8).
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Third-Party Services</h2>
            <p className="mb-3">SocialMind integrates with the following third-party services:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400">
              <li><strong className="text-gray-300">Meta Graph API</strong> — to read and reply to Instagram comments and messages</li>
              <li><strong className="text-gray-300">TikTok for Business API</strong> — to read and reply to TikTok comments</li>
              <li><strong className="text-gray-300">Anthropic Claude API</strong> — to generate AI-powered reply suggestions (comment text only, no personal user data is sent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Your Rights & Data Deletion</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-400 mb-4">
              <li>Access all data we hold about your accounts</li>
              <li>Correct or update your account information</li>
              <li>Delete your data and disconnect all accounts</li>
              <li>Revoke Instagram/TikTok permissions at any time</li>
            </ul>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="text-blue-300 font-medium mb-1">Data Deletion Request</div>
              <p className="text-gray-400">
                To delete all your data from SocialMind, visit our{' '}
                <a href="/data-deletion" className="text-blue-400 underline hover:text-blue-300">
                  Data Deletion page
                </a>{' '}
                or contact us at the email below. We will process your request within 30 days.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Children's Privacy</h2>
            <p>
              SocialMind is not intended for users under the age of 13. We do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of significant
              changes by updating the date at the top of this page. Continued use of SocialMind after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">11. Contact Us</h2>
            <div className="bg-white/5 rounded-lg p-4">
              <p>If you have any questions about this Privacy Policy or your data, contact us at:</p>
              <div className="mt-3 space-y-1 text-gray-400">
                <div><strong className="text-gray-300">App:</strong> SocialMind</div>
                <div><strong className="text-gray-300">Email:</strong> privacy@socialmind.app</div>
                <div><strong className="text-gray-300">Data Deletion:</strong>{' '}
                  <a href="/data-deletion" className="text-blue-400 underline hover:text-blue-300">
                    socialmind-frontend-production.up.railway.app/data-deletion
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-center text-gray-600 text-xs">
          © 2026 SocialMind. All rights reserved.
        </div>
      </div>
    </div>
  );
}
