class CalendarUI {
  constructor(dsaCalendar) {
    this.calendar = dsaCalendar;
    this.element = null;
    this.currentDate = this.loadDate();
    this.isUpdating = false;
    this.holidays = [];
    this.currentHolidayIndex = 0;
    this.loadHolidays();
  }
  
  async loadHolidays() {
    console.log('DSA Calendar | Versuche Feiertage zu laden...');
    try {
      const url = 'modules/e9l-dsa5-aventurian-calendar/data/holidays.json';
      console.log('DSA Calendar | Lade von URL:', url);
      
      const response = await fetch(url);
      console.log('DSA Calendar | Response Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.holidays = data.feiertage || [];
      console.log('DSA Calendar | Feiertage erfolgreich geladen:', this.holidays.length);
      console.log('DSA Calendar | Erste 3 Feiertage:', this.holidays.slice(0, 3));
    } catch (error) {
      console.error('DSA Calendar | FEHLER beim Laden der Feiertage:', error);
      console.error('DSA Calendar | Verwende Fallback - leeres Array');
      this.holidays = [];
    }
  }
  
  getHolidaysForDate(day, month) {
    // WICHTIG: Entferne "mond" vom Monatsnamen für das Matching
    // "Praiosmond" -> "Praios", "Rondramond" -> "Rondra", etc.
    const monthShort = month.replace('mond', '');
    
    console.log(`DSA Calendar | Suche Feiertage für: ${day}. ${monthShort} (Original: ${month})`);
    
    // Normalisiere das Datum-Format mit beiden Varianten
    const dateStr = `${day}. ${monthShort}`;
    const dateStrAlt = `${day}. ${monthShort} `;
    const dateStrFull = `${day}. ${month}`;
    const dateStrFullAlt = `${day}. ${month} `;
    
    // Spezialfall für mehrtägige Feiertage - teste beide Monatsvarianten
    const rangePattern = new RegExp(`(\\d+)\\. ${monthShort} bis (\\d+)\\. ${monthShort}`);
    const rangePatternFull = new RegExp(`(\\d+)\\. ${month} bis (\\d+)\\. ${month}`);
    
    const matchingHolidays = this.holidays.filter(holiday => {
      // Exakte Übereinstimmung - teste alle Varianten
      if (holiday.date === dateStr || 
          holiday.date === dateStrAlt || 
          holiday.date === dateStrFull || 
          holiday.date === dateStrFullAlt) {
        console.log(`DSA Calendar | Gefunden (exakt): ${holiday.name}`);
        return true;
      }
      
      // Prüfe auf Datumsbereiche (z.B. "15. Praios bis 16. Praios")
      const rangeMatch = holiday.date.match(rangePattern) || holiday.date.match(rangePatternFull);
      if (rangeMatch) {
        const startDay = parseInt(rangeMatch[1]);
        const endDay = parseInt(rangeMatch[2]);
        if (day >= startDay && day <= endDay) {
          console.log(`DSA Calendar | Gefunden (Bereich): ${holiday.name}`);
          return true;
        }
      }
      
      // Prüfe auf Feiertage die nur den Monat angeben (z.B. "Tsa" für Herzogsstippen)
      if (holiday.date === monthShort || holiday.date === month) {
        console.log(`DSA Calendar | Gefunden (nur Monat): ${holiday.name}`);
        return true;
      }
      
      // Prüfe auf variable Feiertage (z.B. "17. Efferd, 19. Firun, 21. Ingerimm")
      const dates = holiday.date.split(',').map(d => d.trim());
      for (let date of dates) {
        if (date === dateStr || 
            date === dateStrAlt || 
            date === dateStrFull || 
            date === dateStrFullAlt) {
          console.log(`DSA Calendar | Gefunden (variabel): ${holiday.name}`);
          return true;
        }
      }
      
      return false;
    });
    
    // Spezialbehandlung für Namenlose Tage
    if (this.calendar.isNamelessDays(month)) {
      console.log('DSA Calendar | Prüfe Namenlose Tage');
      const namelessHolidays = this.holidays.filter(holiday => {
        return holiday.date.includes('Namenloser');
      });
      const filtered = namelessHolidays.filter(holiday => {
        const match = holiday.date.match(/(\d+)\. Namenloser/);
        if (match) {
          const matches = parseInt(match[1]) === day;
          if (matches) {
            console.log(`DSA Calendar | Gefunden (Namenloser Tag): ${holiday.name}`);
          }
          return matches;
        }
        return false;
      });
      return filtered;
    }
    
    console.log(`DSA Calendar | Insgesamt ${matchingHolidays.length} Feiertage gefunden`);
    return matchingHolidays;
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
  
  createHolidayTooltip(holidays, index = 0) {
    if (!holidays || holidays.length === 0) return '';
    
    const holiday = holidays[index];
    const typeIcon = holiday.type === 'weltlich' 
      ? '<i class="fas fa-globe"></i>' 
      : '<i class="fas fa-pray"></i>';
    
    const prevDisabled = index === 0 ? 'disabled' : '';
    const nextDisabled = index === holidays.length - 1 ? 'disabled' : '';
    
    // Zeige Navigation nur wenn mehr als 1 Feiertag vorhanden
    const showNavigation = holidays.length > 1;
    
    return `
      <div class="holiday-tooltip" data-holidays='${JSON.stringify(holidays)}' data-index="${index}">
        <div class="holiday-header">
          <span class="holiday-type">${typeIcon}</span>
          <span class="holiday-name">${holiday.name}</span>
        </div>
        <div class="holiday-comment">${holiday.comment || ''}</div>
        ${showNavigation ? `
          <div class="holiday-navigation">
            <button class="holiday-nav-btn holiday-prev" ${prevDisabled}>
              <i class="fas fa-arrow-circle-left"></i>
            </button>
            <button class="holiday-nav-btn holiday-next" ${nextDisabled}>
              <i class="fas fa-arrow-circle-right"></i>
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  attachHolidayTooltip() {
    const dateElement = this.element.find('.calendar-date-text');
    console.log('DSA Calendar | AttachHolidayTooltip - Element gefunden:', dateElement.length);
    
    let tooltipTimeout;
    let tooltipElement;
    
    dateElement.on('mouseenter', (e) => {
      console.log('DSA Calendar | Mouse Enter auf Datum');
      console.log('DSA Calendar | Aktuelles Datum:', this.currentDate.day, this.currentDate.month);
      
      // Verzögerung vor dem Anzeigen (300ms)
      tooltipTimeout = setTimeout(() => {
        console.log('DSA Calendar | Suche Feiertage für:', this.currentDate.day, this.currentDate.month);
        const holidays = this.getHolidaysForDate(this.currentDate.day, this.currentDate.month);
        console.log('DSA Calendar | Gefundene Feiertage:', holidays.length, holidays);
        
        if (holidays.length > 0) {
          console.log('DSA Calendar | Erstelle Tooltip für Feiertage');
          
          // Entferne existierenden Tooltip
          $('.holiday-tooltip-wrapper').remove();
          
          // Erstelle neuen Tooltip
          const tooltipHTML = this.createHolidayTooltip(holidays, 0);
          console.log('DSA Calendar | Tooltip HTML erstellt');
          
          tooltipElement = $(`
            <div class="holiday-tooltip-wrapper">
              ${tooltipHTML}
            </div>
          `);
          
          // Füge Tooltip zum Body hinzu
          $('body').append(tooltipElement);
          console.log('DSA Calendar | Tooltip zum Body hinzugefügt');
          
          // Positioniere den Tooltip über dem Datum
          const rect = dateElement[0].getBoundingClientRect();
          const tooltipHeight = tooltipElement.outerHeight();
          console.log('DSA Calendar | Position berechnet - Rect:', rect, 'Height:', tooltipHeight);
          
          tooltipElement.css({
            left: rect.left + (rect.width / 2),
            top: rect.top - tooltipHeight - 10
          });
          
          // Event-Handler für Navigation zwischen mehreren Feiertagen
          tooltipElement.on('click', '.holiday-nav-btn:not([disabled])', function(e) {
            e.stopPropagation();
            const tooltip = $(this).closest('.holiday-tooltip');
            const holidays = JSON.parse(tooltip.attr('data-holidays'));
            let currentIndex = parseInt(tooltip.attr('data-index'));
            
            if ($(this).hasClass('holiday-prev')) {
              currentIndex = Math.max(0, currentIndex - 1);
            } else {
              currentIndex = Math.min(holidays.length - 1, currentIndex + 1);
            }
            
            // Update Tooltip-Inhalt mit neuem Feiertag
            const newContent = $(e.delegateTarget).data('calendarUI').createHolidayTooltip(holidays, currentIndex);
            tooltip.parent().html(newContent);
          });
          
          // Speichere CalendarUI Referenz für Event-Handler
          tooltipElement.data('calendarUI', this);
        } else {
          console.log('DSA Calendar | Keine Feiertage für dieses Datum gefunden');
        }
      }, 300);
    });
    
    dateElement.on('mouseleave', () => {
      clearTimeout(tooltipTimeout);
      
      // Verzögertes Entfernen, falls Maus zum Tooltip bewegt wird
      setTimeout(() => {
        if (!$('.holiday-tooltip-wrapper:hover').length) {
          $('.holiday-tooltip-wrapper').remove();
        }
      }, 100);
    });
    
    // Entferne Tooltip wenn Maus ihn verlässt
    $(document).on('mouseleave', '.holiday-tooltip-wrapper', function() {
      $(this).remove();
    });
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
    
    // Prüfe ob Feiertage für dieses Datum existieren
    const holidays = this.getHolidaysForDate(this.currentDate.day, this.currentDate.month);
    
    this.element = $(`
      <div id="e9l-dsa5-aventurian-calendar-overlay" class="e9l-dsa5-aventurian-calendar-overlay">
        <div class="e9l-dsa5-aventurian-calendar-trapez">
          <div class="calendar-controls">
            <button class="calendar-btn calendar-prev calendar-tooltip" data-tooltip="${prevButtonTooltip}">
              <i class="fas fa-arrow-circle-left"></i>
            </button>
            <span class="calendar-date">
              <span class="calendar-date-text">
                ${this.currentDate.day} ${this.currentDate.month}
              </span>
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
    
    // Füge Holiday-Tooltip Event-Handler hinzu
    this.attachHolidayTooltip();
    
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
    
    // Prüfe ob Feiertage für dieses Datum existieren
    const holidays = this.getHolidaysForDate(this.currentDate.day, this.currentDate.month);
    
    this.element.find('.calendar-date').html(`
      <span class="calendar-date-text">
        ${this.currentDate.day} ${this.currentDate.month}
      </span>
      <span class="calendar-symbol calendar-tooltip" data-tooltip="${moonPhase.name}">${moonPhase.symbol}</span> 
      - 
      <span class="calendar-symbol calendar-tooltip" data-tooltip="${season.name}">${season.symbol}</span> 
      ${this.currentDate.year} ${yearSuffix} - ${weekday}
    `);
    
    // Tooltip-Events neu anhängen nach Update
    this.attachHolidayTooltip();
    
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
    // Entferne auch alle Tooltips beim Zerstören
    $('.holiday-tooltip-wrapper').remove();
  }
}

// Klasse global verfügbar machen
window.CalendarUI = CalendarUI;