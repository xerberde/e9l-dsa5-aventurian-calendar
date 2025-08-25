class DSACalendar {
  constructor() {
    // Basis-Arrays mit Keys für Übersetzung
    this.monthKeys = [
      "Praiosmond", "Rondramond", "Efferdmond", "Traviamond",
      "Boronmond", "Hesindemond", "Firunmond", "Tsamond",
      "Phexmond", "Perainemond", "Ingerimmmond", "Rahjamond"
    ];
    
    this.weekdayKeys = [
      "Windstag", "Erdstag", "Markttag", "Praiostag",
      "Rohalstag", "Feuertag", "Wassertag"
    ];
    
    this.moonPhaseKeys = [
      { key: "ToteMada", symbol: "🌑", days: 1 },
      { key: "AuffuellenderKelch", symbol: "🌒", days: 6 },
      { key: "Kelch", symbol: "🌓", days: 1 },
      { key: "ZunehmendesRad", symbol: "🌔", days: 6 },
      { key: "Rad", symbol: "🌕", days: 1 },
      { key: "AbnehmendesRad", symbol: "🌖", days: 6 },
      { key: "Helm", symbol: "🌗", days: 1 },
      { key: "AbnehmenderHelm", symbol: "🌘", days: 6 }
    ];
    
    this.seasonKeys = [
      { key: "Sommer", symbol: "☀️", start: { month: 11, day: 21 } },
      { key: "Herbst", symbol: "🍂", start: { month: 2, day: 22 } },
      { key: "Winter", symbol: "❄️", start: { month: 5, day: 21 } },
      { key: "Fruehling", symbol: "🌸", start: { month: 8, day: 20 } }
    ];
    
    // Build translated arrays - aber erst wenn i18n bereit ist
    if (game && game.i18n && game.i18n.lang) {
      this.buildTranslations();
    }
  }
  
  // Stelle sicher, dass Übersetzungen verfügbar sind
  ensureTranslations() {
    if (!this.months || this.months.length === 0) {
      this.buildTranslations();
    }
  }
  
  buildTranslations() {
    // Monate mit Übersetzungen
    this.months = this.monthKeys.map(key => ({
      name: this.getMonthName(key),
      key: key,
      days: 30,
      god: key.replace("mond", "")
    }));
    
    // Wochentage
    this.weekdays = this.weekdayKeys.map(key => 
      game.i18n.localize(`E9L-DSA5-AVENTURIAN-CALENDAR.Weekdays.${key}`)
    );
    
    // Mondphasen
    this.moonPhases = this.moonPhaseKeys.map(phase => ({
      name: game.i18n.localize(`E9L-DSA5-AVENTURIAN-CALENDAR.MoonPhases.${phase.key}`),
      symbol: phase.symbol,
      days: phase.days
    }));
    
    // Jahreszeiten
    this.seasons = this.seasonKeys.map(season => ({
      name: game.i18n.localize(`E9L-DSA5-AVENTURIAN-CALENDAR.Seasons.${season.key}`),
      symbol: season.symbol,
      start: season.start
    }));
  }
  
  getMonthName(monthKey) {
    if (!monthKey || monthKey === "NamelessDays") {
      return game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.Months.NamelessDays");
    }
    return game.i18n.localize(`E9L-DSA5-AVENTURIAN-CALENDAR.Months.${monthKey}`);
  }
  
  getNamelessDaysName() {
    return game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.Months.NamelessDays");
  }
  
  // Zentrale Hilfsfunktion für Nameless Days Prüfung
  isNamelessDays(month) {
    const namelessName = this.getNamelessDaysName();
    return month === namelessName || 
           month === "Namenloser Tag" || 
           month === "Namenlose Tage" || 
           month === "NamelessDays" ||
           month === -1;
  }
  
  // Zentrale MonthIndex Normalisierung
  normalizeMonthIndex(month) {
    if (this.isNamelessDays(month)) {
      return -1;
    }
    this.ensureTranslations();
    return typeof month === 'string' 
      ? this.months.findIndex(m => m.name === month || m.key === month)
      : month;
  }
  
  // Konvertiere Datum zu Tagen seit Jahresbeginn
  dateToDayOfYear(day, month, year) {
    if (this.isNamelessDays(month)) {
      return 360 + day;
    }
    
    let dayOfYear = 0;
    const monthIndex = this.normalizeMonthIndex(month);
    
    for (let i = 0; i < monthIndex; i++) {
      dayOfYear += this.months[i].days;
    }
    dayOfYear += day;
    return dayOfYear;
  }
  
  // Konvertiere Tage seit Jahresbeginn zu Datum
  dayOfYearToDate(dayOfYear, year) {
    this.ensureTranslations();
    // Namenlose Tage (Tag 361-365, also nach allen 12 Monaten)
    if (dayOfYear > 360) {
      return {
        day: dayOfYear - 360,
        month: this.getNamelessDaysName(),
        year: year,
        monthIndex: -1
      };
    }
    
    let remainingDays = dayOfYear;
    for (let i = 0; i < this.months.length; i++) {
      if (remainingDays <= this.months[i].days) {
        return {
          day: remainingDays,
          month: this.months[i].name,
          year: year,
          monthIndex: i
        };
      }
      remainingDays -= this.months[i].days;
    }
    
    // Fallback
    return {
      day: 1,
      month: this.months[0].name,
      year: year,
      monthIndex: 0
    };
  }
  
  // Berechne Wochentag
  getWeekday(day, month, year) {
    this.ensureTranslations();
    const totalDays = (year - 1) * 365 + this.dateToDayOfYear(day, month, year);
    return this.weekdays[totalDays % 7];
  }
  
  // Berechne Mondphase
  getMoonPhase(day, month, year) {
    this.ensureTranslations();
    const totalDays = (year - 1) * 365 + this.dateToDayOfYear(day, month, year);
    const moonCycle = 28;
    const dayInCycle = (totalDays + 17) % moonCycle;
    
    let currentDay = 0;
    for (const phase of this.moonPhases) {
      if (dayInCycle < currentDay + phase.days) {
        return phase;
      }
      currentDay += phase.days;
    }
    return this.moonPhases[0];
  }
  
  // Berechne Jahreszeit
  getSeason(day, month, year) {
    this.ensureTranslations();
    if (this.isNamelessDays(month)) {
      return this.seasons[2]; // Winter
    }
    
    const monthIndex = this.normalizeMonthIndex(month);
    if (monthIndex === -1) return this.seasons[2];
    
    for (let i = 0; i < this.seasons.length; i++) {
      const season = this.seasons[i];
      const nextSeason = this.seasons[(i + 1) % this.seasons.length];
      
      if (this.isDateInSeason(day, monthIndex, season, nextSeason)) {
        return season;
      }
    }
    
    return this.seasons[2];
  }
  
  isDateInSeason(day, monthIndex, season, nextSeason) {
    const currentDayOfYear = this.dateToDayOfYear(day, monthIndex, 1);
    const seasonStart = this.dateToDayOfYear(season.start.day, season.start.month, 1);
    const nextSeasonStart = this.dateToDayOfYear(nextSeason.start.day, nextSeason.start.month, 1);
    
    if (seasonStart < nextSeasonStart) {
      return currentDayOfYear >= seasonStart && currentDayOfYear < nextSeasonStart;
    } else {
      return currentDayOfYear >= seasonStart || currentDayOfYear < nextSeasonStart;
    }
  }
  
  // Navigation
  addDays(currentDate, days) {
    let { day, month, year } = currentDate;
    const monthIndex = this.normalizeMonthIndex(month);
    
    let totalDays = this.dateToDayOfYear(day, monthIndex, year) + days;
    
    while (totalDays > 365) {
      totalDays -= 365;
      year++;
    }
    while (totalDays <= 0) {
      totalDays += 365;
      year--;
    }
    
    return this.dayOfYearToDate(totalDays, year);
  }
  
  addMonths(currentDate, months) {
    this.ensureTranslations();
    let { day, month, year } = currentDate;
    let monthIndex = this.normalizeMonthIndex(month);
    
    if (this.isNamelessDays(month)) {
      if (months > 0) {
        return {
          day: Math.min(day, this.months[0].days),
          month: this.months[0].name,
          year: year + 1,
          monthIndex: 0
        };
      } else {
        return {
          day: Math.min(day, this.months[11].days),
          month: this.months[11].name,
          year: year,
          monthIndex: 11
        };
      }
    }
    
    monthIndex += months;
    
    while (monthIndex >= 12) {
      monthIndex -= 12;
      year++;
    }
    while (monthIndex < 0) {
      monthIndex += 12;
      year--;
    }
    
    if (monthIndex === 12) {
      return {
        day: Math.min(day, 5),
        month: this.getNamelessDaysName(),
        year: year,
        monthIndex: -1
      };
    }
    
    day = Math.min(day, this.months[monthIndex].days);
    return {
      day: day,
      month: this.months[monthIndex].name,
      year: year,
      monthIndex: monthIndex
    };
  }
}

// Klasse global verfügbar machen
window.DSACalendar = DSACalendar;