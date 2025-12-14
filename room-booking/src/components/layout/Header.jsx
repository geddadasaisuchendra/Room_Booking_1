import React from "react";
import logo from "../../assets/logo.png"; // placeholder logo

export default function Header() {
  return (
    <>
      {/* Top Language Bar */}
      <div className="lang-bar">
        <div className="container d-flex justify-content-end gap-3 text-white small">
          <span>EN</span>
          <span>हि</span>
          <span>ತೇ</span>
          <span>త</span>
        </div>
      </div>

      {/* Main Temple Header */}
      <header className="temple-header">
        <div className="container d-flex flex-column align-items-center text-center py-3">

          {/* LOGO CENTER */}
          <img src={logo} alt="Temple Logo" className="temple-logo mb-2" />

          {/* Slogans Left + Right */}
          <div className="w-100 d-flex justify-content-between slogan-bar px-2">
            <span>|| Sriman Moola Ramo Vijayate ||</span>
            <span>|| Sri Gururajo Vijayate ||</span>
          </div>

          {/* TITLES */}
          <div className="temple-title text-white fw-bold mt-2">
            JAGADGURU SRIMANMADHAVACHARYA MOOLA MAHASANSTHANAM
          </div>

          <div className="temple-subtitle fw-bold">
            SRI RAGHAVENDRA SWAMY MATHA, MANTRALAYAM
          </div>

        </div>
      </header>
    </>
  );
}
