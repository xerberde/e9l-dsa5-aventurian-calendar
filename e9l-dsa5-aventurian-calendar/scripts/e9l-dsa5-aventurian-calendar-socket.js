class CalendarSocket {
  constructor(calendarUI, dsaCalendar) {
    console.log("DSA Calendar | CalendarSocket Constructor gestartet");
    this.calendarUI = calendarUI;
    this.dsaCalendar = dsaCalendar;
    console.log("DSA Calendar | Rufe setupSocketListener auf");
    this.setupSocketListener();
    console.log("DSA Calendar | setupSocketListener abgeschlossen");
  }
  
  async saveDate(currentDate) {
    console.log("DSA Calendar | saveDate aufgerufen, isGM:", game.user.isGM, "isUpdating:", this.calendarUI.isUpdating);
    if (this.calendarUI.isUpdating) return;
    
    if (game.user.isGM) {
      try {
        console.log("DSA Calendar | GM speichert Datum:", currentDate);
        await game.settings.set("e9l-dsa5-aventurian-calendar", "currentDate", currentDate);
        
        console.log("DSA Calendar | GM sendet dateChanged Socket-Nachricht an alle");
        console.log("DSA Calendar | Socket verfügbar?", !!game.socket);
        console.log("DSA Calendar | User ID:", game.user.id);
        
        const socketData = {
          action: 'dateChanged',
          date: currentDate,
          userId: game.user.id
        };
        console.log("DSA Calendar | Sende Socket-Daten:", socketData);
        
        game.socket.emit("module.e9l-dsa5-aventurian-calendar", socketData);
        console.log("DSA Calendar | Socket emit abgeschlossen");
        
        // Chat-Nachrichten sind deaktiviert
        // this.sendChatNotification(game.user.id, currentDate);
        
      } catch (error) {
        console.error("DSA Calendar | Fehler beim Speichern des Datums:", error);
      }
    } else {
      console.log("DSA Calendar | Spieler sendet requestDateChange:", currentDate);
      console.log("DSA Calendar | Socket verfügbar?", !!game.socket);
      console.log("DSA Calendar | User ID:", game.user.id);
      
      const socketData = {
        action: 'requestDateChange',
        date: currentDate,
        userId: game.user.id
      };
      console.log("DSA Calendar | Sende Socket-Daten:", socketData);
      
      game.socket.emit("module.e9l-dsa5-aventurian-calendar", socketData);
      console.log("DSA Calendar | Socket emit abgeschlossen");
    }
  }
  
  setupSocketListener() {
    console.log("DSA Calendar | Socket-Listener wird eingerichtet");
    console.log("DSA Calendar | Registriere Socket für:", "module.e9l-dsa5-aventurian-calendar");
    
    game.socket.on("module.e9l-dsa5-aventurian-calendar", async (data) => {
      console.log("DSA Calendar | Socket-Nachricht empfangen:", data);
      console.log("DSA Calendar | Von User ID:", data.userId, "Ich bin:", game.user.id);
      
      switch(data.action) {
        case 'requestDateChange':
          console.log("DSA Calendar | RequestDateChange empfangen, bin ich GM?", game.user.isGM);
          if (game.user.isGM) {
            console.log("DSA Calendar | GM verarbeitet Datumsänderung von", data.userId);
            try {
              // Daten vor dem Speichern validieren und korrigieren
              const validatedDate = { ...data.date };
              if (validatedDate.monthIndex === undefined || 
                  (this.dsaCalendar.isNamelessDays(validatedDate.month) && validatedDate.monthIndex !== -1) ||
                  (!this.dsaCalendar.isNamelessDays(validatedDate.month) && validatedDate.monthIndex === -1)) {
                validatedDate.monthIndex = this.dsaCalendar.normalizeMonthIndex(validatedDate.month);
              }
              
              console.log("DSA Calendar | GM speichert validiertes Datum:", validatedDate);
              await game.settings.set("e9l-dsa5-aventurian-calendar", "currentDate", validatedDate);
              
              console.log("DSA Calendar | GM sendet dateChanged an alle");
              game.socket.emit("module.e9l-dsa5-aventurian-calendar", {
                action: 'dateChanged',
                date: validatedDate,
                userId: data.userId
              });
              
              if (this.calendarUI) {
                console.log("DSA Calendar | GM aktualisiert eigene UI");
                this.calendarUI.onDateChanged(validatedDate);
              }
              
              // Chat-Nachrichten sind deaktiviert
              // if (this.calendarUI) {
              //   this.sendChatNotification(data.userId, validatedDate);
              // }
              
            } catch (error) {
              console.error("DSA Calendar | Fehler beim Verarbeiten der Datumsänderung:", error);
            }
          }
          break;
          
        case 'dateChanged':
          console.log("DSA Calendar | dateChanged empfangen, aktualisiere UI");
          if (this.calendarUI) {
            this.calendarUI.onDateChanged(data.date);
          }
          break;
          
        default:
          console.log("DSA Calendar | Unbekannte Socket-Aktion:", data.action);
      }
    });
    
    console.log("DSA Calendar | Socket-Listener registriert");
  }
  
  // Chat-Benachrichtigung (momentan deaktiviert)
  sendChatNotification(userId, newDate) {
    const user = game.users.get(userId);
    const yearSuffix = game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.YearSuffix");
    const message = game.i18n.format("E9L-DSA5-AVENTURIAN-CALENDAR.Chat.DateChanged", { user: user.name });
    const dateValue = game.i18n.format("E9L-DSA5-AVENTURIAN-CALENDAR.Chat.DateChangedValue", {
      day: newDate.day,
      month: newDate.month,
      year: newDate.year
    });
    
    ChatMessage.create({
      content: `<div class="e9l-dsa5-aventurian-calendar-notification">
        <i class="fas fa-calendar-alt"></i> 
        ${message}
        <strong>${dateValue}</strong>
      </div>`,
      speaker: { alias: game.i18n.localize("E9L-DSA5-AVENTURIAN-CALENDAR.Chat.CalendarTitle") }
    });
  }
  
  // API für andere Module
  async setCurrentDate(date) {
    // Daten vor dem Setzen validieren
    const validatedDate = { ...date };
    if (this.dsaCalendar && (validatedDate.monthIndex === undefined || 
        (this.dsaCalendar.isNamelessDays(validatedDate.month) && validatedDate.monthIndex !== -1) ||
        (!this.dsaCalendar.isNamelessDays(validatedDate.month) && validatedDate.monthIndex === -1))) {
      validatedDate.monthIndex = this.dsaCalendar.normalizeMonthIndex(validatedDate.month);
    }
    
    if (game.user.isGM) {
      await game.settings.set("e9l-dsa5-aventurian-calendar", "currentDate", validatedDate);
      game.socket.emit("module.e9l-dsa5-aventurian-calendar", {
        action: 'dateChanged',
        date: validatedDate,
        userId: game.user.id
      });
      if (this.calendarUI) {
        this.calendarUI.onDateChanged(validatedDate);
      }
    } else {
      game.socket.emit("module.e9l-dsa5-aventurian-calendar", {
        action: 'requestDateChange',
        date: validatedDate,
        userId: game.user.id
      });
    }
  }
}

// Klasse global verfügbar machen
window.CalendarSocket = CalendarSocket;