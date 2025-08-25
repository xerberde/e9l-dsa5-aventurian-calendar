class CalendarUI {
  constructor(dsaCalendar) {
    this.calendar = dsaCalendar;
    this.element = null;
    this.currentDate = this.loadDate();
    this.isUpdating = false;
  }
  
  loadDate() {
    const worldData = game.settings.get("e9l-dsa5-aventurian-calendar", "currentDate");
    
    // Erweiterte Migration für alle möglichen alten Varianten
    if (worldData) {
      const namelessName = this.calendar.getNamelessDaysName();
      
      // Alle bekannten alten Nameless Days Varianten migrieren
      if (worldData.month === "Namenlose Tage" || 
          worldData.month === "Namenloser Tag" ||
          worldData.month === "NamelessDays") {
        worldData.month = namelessName;
        worldData.monthIndex = -1;
      }
      
      // MonthIndex korrigieren falls fehlt oder inkonsistent
      if (worldData.monthIndex === undefined || 
          (this.calendar.isNamelessDays(worldData.month) && worldData.monthIndex !== -1) ||
          (!this.calendar.isNamelessDays(worldData.month) && worldData.monthIndex === -1)) {
        worldData.monthIndex = this.calendar.normalizeMonthIndex(worldData.month);
      }
      
      return worldData;
    }
    
    // Standard-Fallback
    return { 
      day: 1, 
      month: game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.Months.Praiosmond"), 
      year: 1030, 
      monthIndex: 0 
    };
  }
  
  onDateChanged(newDate) {
    console.log("DSA Calendar | Datum geändert zu:", newDate);
    this.isUpdating = true;
    this.currentDate = newDate;
    
    // MonthIndex bei empfangenen Daten korrigieren falls nötig
    if (this.currentDate.monthIndex === undefined || 
        (this.calendar.isNamelessDays(this.currentDate.month) && this.currentDate.monthIndex !== -1) ||
        (!this.calendar.isNamelessDays(this.currentDate.month) && this.currentDate.monthIndex === -1)) {
      this.currentDate.monthIndex = this.calendar.normalizeMonthIndex(this.currentDate.month);
    }
    
    this.updateDisplay();
    this.isUpdating = false;
  }
  
  render() {
    if (this.element && this.element.parent().length > 0) {
      return;
    }
    
    if (this.element) {
      this.element.remove();
    }
    
    const monthIndex = this.calendar.normalizeMonthIndex(this.currentDate.month);
    const weekday = this.calendar.getWeekday(this.currentDate.day, monthIndex, this.currentDate.year);
    const moonPhase = this.calendar.getMoonPhase(this.currentDate.day, monthIndex, this.currentDate.year);
    const season = this.calendar.getSeason(this.currentDate.day, this.currentDate.month, this.currentDate.year);
    
    // Tooltip-Texte - Zeilenumbrüche normalisieren
    const seasonTooltip = season.name;
    const moonTooltip = moonPhase.name;
    const prevButtonTooltip = game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.Navigation.TooltipPrevious");
    const nextButtonTooltip = game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.Navigation.TooltipNext");
    const yearSuffix = game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.YearSuffix");
    
    this.element = $(`
      <div id="e9l-dsa5-aventurian-calendar-overlay" class="e9l-dsa5-aventurian-calendar-overlay">
        <div class="e9l-dsa5-aventurian-calendar-trapez">
          <div class="calendar-controls">
            <button class="calendar-btn calendar-prev calendar-tooltip" data-tooltip="${prevButtonTooltip}">
              <i class="fas fa-arrow-circle-left"></i>
            </button>
            <span class="calendar-date">
              ${this.currentDate.day} ${this.currentDate.month} 
              <span class="calendar-symbol calendar-tooltip" data-tooltip="${moonTooltip}">${moonPhase.symbol}</span> 
              - 
              <span class="calendar-symbol calendar-tooltip" data-tooltip="${seasonTooltip}">${season.symbol}</span> 
              ${this.currentDate.year} ${yearSuffix} - ${weekday}
            </span>
            <button class="calendar-btn calendar-next calendar-tooltip" data-tooltip="${nextButtonTooltip}">
              <i class="fas fa-arrow-circle-right"></i>
            </button>
          </div>
        </div>
      </div>
    `);
    
    this.element.find('.calendar-prev').on('click', (e) => this.navigate(-1, e));
    this.element.find('.calendar-next').on('click', (e) => this.navigate(1, e));
    
    $('body').append(this.element);
    
    // Nebel-Effekt beim ersten Laden prüfen
    this.updateNamelessDaysFog();
  }
  
  navigate(direction, event) {
    if (event.shiftKey) {
      this.currentDate = this.calendar.addMonths(this.currentDate, direction);
    } else if (event.ctrlKey || event.metaKey) {
      this.currentDate = { 
        ...this.currentDate, 
        year: this.currentDate.year + direction,
        monthIndex: this.calendar.normalizeMonthIndex(this.currentDate.month)
      };
    } else {
      this.currentDate = this.calendar.addDays(this.currentDate, direction);
    }
    
    // Verwende die Socket-Klasse für das Speichern
    if (window.calendarSocket) {
      window.calendarSocket.saveDate(this.currentDate);
    }
    this.updateDisplay();
  }
  
  updateDisplay() {
    if (!this.element || this.element.parent().length === 0) {
      this.render();
      return;
    }
    
    const monthIndex = this.calendar.normalizeMonthIndex(this.currentDate.month);
    const weekday = this.calendar.getWeekday(this.currentDate.day, monthIndex, this.currentDate.year);
    const moonPhase = this.calendar.getMoonPhase(this.currentDate.day, monthIndex, this.currentDate.year);
    const season = this.calendar.getSeason(this.currentDate.day, this.currentDate.month, this.currentDate.year);
    const yearSuffix = game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.YearSuffix");
    
    this.element.find('.calendar-date').html(`
      ${this.currentDate.day} ${this.currentDate.month} 
      <span class="calendar-symbol calendar-tooltip" data-tooltip="${moonPhase.name}">${moonPhase.symbol}</span> 
      - 
      <span class="calendar-symbol calendar-tooltip" data-tooltip="${season.name}">${season.symbol}</span> 
      ${this.currentDate.year} ${yearSuffix} - ${weekday}
    `);
    
    // Nebel-Effekt für Namenlose Tage
    this.updateNamelessDaysFog();
  }
  
  updateNamelessDaysFog() {
    const isNamelessDays = this.calendar.isNamelessDays(this.currentDate.month);
    
    if (isNamelessDays) {
      // Nebel aktivieren
      $('body').addClass('nameless-days-fog');
      console.log("DSA Calendar | Namenlose Tage - Nebel aktiviert");
    } else {
      // Nebel deaktivieren  
      $('body').removeClass('nameless-days-fog');
    }
  }
  
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Klasse global verfügbar machen
window.CalendarUI = CalendarUI;