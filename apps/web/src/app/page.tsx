"use client";

import { useEffect, useRef, useState } from "react";

type Language = "en" | "si";
type AuthMode = "login" | "register";

const copy = {
  en: {
    auctions: "Auctions", sell: "Sell an item", signIn: "Sign in", browse: "Explore live bids", kicker: "BID ON MORE THAN JUST VEHICLES",
    title: "Bid on what matters to you.",
    intro: "Find vehicles, electronics, household essentials, lifestyle items, and land in one trusted marketplace. Discover it, bid on it, own it.",
    current: "Current bid", bids: "bids", ends: "Ends in", activity: "Recent activity", sold: "SOLD",
    closes: "Live auction", featured: "Featured auctions", view: "View all auctions", bidNow: "Bid now",
    language: "සිංහල", getStarted: "Get started", footerDescription: "A trusted marketplace for discovering, bidding, and owning what matters to you.", marketplace: "Marketplace",
    company: "Company", support: "Support", categories: "Categories", about: "About us", contact: "Contact us", help: "Help center",
    vehicles: "Vehicles", electronics: "Electronics", household: "Household", lifestyle: "Lifestyle", land: "Land", rights: "All rights reserved.",
    login: "Log in", register: "Register", welcomeBack: "Welcome back", createAccount: "Create your account", name: "Full name", email: "Email address", password: "Password", continueLogin: "Log in", continueRegister: "Create account", noAccount: "New to Bidly?", haveAccount: "Already have an account?", close: "Close",
  },
  si: {
    auctions: "වෙන්දේසි", sell: "භාණ්ඩයක් විකිණීම", signIn: "ඇතුළු වන්න", browse: "සජීවී ලංසු සොයන්න", kicker: "වාහනවලට පමණක් සීමා නොවූ ලංසු",
    title: "ඔබට වැදගත් දේ සඳහා ලංසු තබන්න.",
    intro: "වාහන, ඉලෙක්ට්‍රොනික භාණ්ඩ, ගෘහ උපකරණ, ජීවන රටා භාණ්ඩ සහ ඉඩම් එකම විශ්වාසදායක වෙළඳපොළකින් සොයාගන්න. සොයන්න, ලංසු තබන්න, හිමිකරගන්න.",
    current: "වත්මන් ලංසුව", bids: "ලංසු", ends: "අවසන් වීමට", activity: "මෑත ක්‍රියාකාරකම්", sold: "විකුණන ලදී",
    closes: "සජීවී වෙන්දේසිය", featured: "විශේෂ වෙන්දේසි", view: "සියලුම වෙන්දේසි බලන්න", bidNow: "දැන් ලංසු තබන්න",
    language: "English", getStarted: "ආරම්භ කරන්න", footerDescription: "ඔබට වැදගත් දේ සොයාගැනීමට, ලංසු තැබීමට සහ හිමිකරගැනීමට විශ්වාසදායක වෙළඳපොළක්.", marketplace: "වෙළඳපොළ",
    company: "සමාගම", support: "සහාය", categories: "කාණ්ඩ", about: "අප ගැන", contact: "අප හා සම්බන්ධ වන්න", help: "උදවු මධ්‍යස්ථානය",
    vehicles: "වාහන", electronics: "ඉලෙක්ට්‍රොනික", household: "ගෘහ භාණ්ඩ", lifestyle: "ජීවන රටාව", land: "ඉඩම්", rights: "සියලුම හිමිකම් ඇවිරිණි.",
    login: "ඇතුළු වන්න", register: "ලියාපදිංචි වන්න", welcomeBack: "නැවත සාදරයෙන් පිළිගනිමු", createAccount: "ඔබේ ගිණුම සාදන්න", name: "සම්පූර්ණ නම", email: "විද්‍යුත් තැපෑල", password: "මුරපදය", continueLogin: "ඇතුළු වන්න", continueRegister: "ගිණුම සාදන්න", noAccount: "Bidly වෙත අලුත්ද?", haveAccount: "දැනටමත් ගිණුමක් තිබේද?", close: "වසන්න",
  },
} as const;

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" /></svg>;
}

function CarIllustration() {
  return (
    <svg className="auction-car" viewBox="0 0 440 150" role="img" aria-label="Land Rover Defender driving at dusk">
      <ellipse cx="220" cy="140" rx="200" ry="7" fill="#000" opacity=".35" />
      <path d="M16 104V30Q16 22 22 22h270l12 38h114q6 0 6 6v38H16Z" fill="#526d58" />
      <path d="M16 32V28q0-6 6-6h270l4 10Z" fill="#e8e6df" />
      <path d="M16 64h408M16 98h408" stroke="#33493a" strokeWidth="3" />
      <path d="M28 38h114v22H28zM152 38h62v22h-62zM224 38h58l12 22h-70z" fill="#1b2340" />
      <path d="M146 34v64M218 34v64" stroke="#2b3f33" strokeWidth="3" />
      <circle cx="104" cy="108" r="37" fill="#141a16" /><circle cx="346" cy="108" r="37" fill="#141a16" />
      <circle cx="104" cy="108" r="18" fill="#aab3c9" /><circle cx="346" cy="108" r="18" fill="#aab3c9" />
      <path d="M104 91v34M87 108h34M92 96l24 24M116 96l-24 24M346 91v34M329 108h34M334 96l24 24M358 96l-24 24" stroke="#0d0f1d" strokeWidth="3" />
      <circle cx="104" cy="108" r="5" fill="#0d0f1d" /><circle cx="346" cy="108" r="5" fill="#0d0f1d" />
      <ellipse cx="421" cy="76" rx="4" ry="8" fill="#fff4d6" /><rect x="14" y="70" width="6" height="20" rx="2" fill="#e5484d" />
    </svg>
  );
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const t = copy[language];

  useEffect(() => {
    const saved = window.localStorage.getItem("bidly-language");
    if (saved === "en" || saved === "si") setLanguage(saved);
    if (videoRef.current) videoRef.current.playbackRate = 2;
  }, []);

  const switchLanguage = () => {
    const next = language === "en" ? "si" : "en";
    setLanguage(next);
    window.localStorage.setItem("bidly-language", next);
  };

  return (
    <main className="auction-page" lang={language === "si" ? "si" : "en"}>
      <section className="auction-hero">
        <nav className="auction-nav container">
          <a className="auction-logo" href="/">Bidly</a>
          <div className="auction-nav-links"><a href="#auctions">{t.auctions}</a><a href="#sell">{t.sell}</a><a href="#signin">{t.signIn}</a></div>
          <button className="auction-language" type="button" onClick={switchLanguage}>EN / සිං</button>
        </nav>
        <div className="auction-copy container">
          <div className="auction-headline">
            <p className="auction-kicker">{t.kicker}</p>
            <h1>{t.title}</h1>
          </div>
        </div>
        <div className="auction-skyline" aria-hidden="true"><span>▥</span><span>▦</span><span>▥</span><span>▦</span><span>▥</span></div>
        <div className="auction-sign sign-left">ගාලු පාර<small>Galle Road</small></div>
        <div className="auction-sign sign-right">කොළඹ<small>Colombo 5 km</small></div>
        <div className="auction-road" aria-hidden="true"><div className="road-lines" /></div>
        <button className="hero-get-started" type="button" onClick={() => setAuthMode("register")}>{t.getStarted} <ArrowIcon /></button>
        <div className="auction-car-wrap">
          <video ref={videoRef} className="auction-hero-video" autoPlay muted loop playsInline preload="metadata">
            <source src="/videos/car-auction-hero.mp4" type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </div>
      </section>
      <footer className="auction-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <a className="auction-logo" href="/">Bidly</a>
            <p>{t.footerDescription}</p>
          </div>
          <div className="footer-column"><h3>{t.marketplace}</h3><a href="#vehicles">{t.vehicles}</a><a href="#electronics">{t.electronics}</a><a href="#household">{t.household}</a><a href="#lifestyle">{t.lifestyle}</a><a href="#land">{t.land}</a></div>
          <div className="footer-column"><h3>{t.company}</h3><a href="#about">{t.about}</a><a href="#contact">{t.contact}</a><a href="#sell">{t.sell}</a></div>
          <div className="footer-column"><h3>{t.support}</h3><a href="#help">{t.help}</a><a href="#contact">{t.contact}</a><a href="#signin">{t.signIn}</a></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 Bidly. {t.rights}</span><span>English · සිංහල</span></div>
      </footer>
      {authMode && (
        <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthMode(null); }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="auth-close" type="button" onClick={() => setAuthMode(null)} aria-label={t.close}>×</button>
            <div className="auth-tabs"><button className={authMode === "login" ? "active" : ""} type="button" onClick={() => setAuthMode("login")}>{t.login}</button><button className={authMode === "register" ? "active" : ""} type="button" onClick={() => setAuthMode("register")}>{t.register}</button></div>
            <p className="auction-kicker">{authMode === "login" ? t.login : t.register}</p>
            <h2 id="auth-title">{authMode === "login" ? t.welcomeBack : t.createAccount}</h2>
            <form onSubmit={(event) => event.preventDefault()}>
              {authMode === "register" && <label>{t.name}<input type="text" name="name" required /></label>}
              <label>{t.email}<input type="email" name="email" required /></label>
              <label>{t.password}<input type="password" name="password" required /></label>
              <button className="auth-submit" type="submit">{authMode === "login" ? t.continueLogin : t.continueRegister}</button>
            </form>
            <p className="auth-switch">{authMode === "login" ? t.noAccount : t.haveAccount} <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? t.register : t.login}</button></p>
          </section>
        </div>
      )}
    </main>
  );
}
