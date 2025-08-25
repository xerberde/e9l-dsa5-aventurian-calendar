// FoundryVTT Integration
let calendarUI = null;
let dsaCalendar = null;
let calendarSocket = null;

Hooks.once('init', () => {
  console.log('DSA Calendar | Initializing...');
  
  game.settings.register("e9l-dsa5-aventurian-calendar", "currentDate", {
    name: "Aktuelles Datum",
    hint: "Das aktuelle Datum im DSA-Kalender",
    scope: "world",
    config: false,
    type: Object,
    default: { day: 1, month: "Praiosmond", year: 1030, monthIndex: 0 }
  });
});

Hooks.once('ready', () => {
  console.log('DSA Calendar | Ready Hook gestartet');
  
  // Initialisiere alle Instanzen in der richtigen Reihenfolge
  dsaCalendar = new DSACalendar();
  console.log('DSA Calendar | DSACalendar Instanz erstellt');
  
  // WICHTIG: Übersetzungen nach dem Laden der Sprachdateien aufbauen
  dsaCalendar.buildTranslations();
  console.log('DSA Calendar | Übersetzungen aufgebaut');
  
  calendarUI = new CalendarUI(dsaCalendar);
  console.log('DSA Calendar | CalendarUI Instanz erstellt');
  
  calendarSocket = new CalendarSocket(calendarUI, dsaCalendar);
  console.log('DSA Calendar | CalendarSocket Instanz erstellt');
  
  // UI für alle angemeldeten Nutzer anzeigen
  calendarUI.render();
  console.log('DSA Calendar | UI gerendert');
  
  // Globale Referenzen für UI-Klasse
  window.calendarUI = calendarUI;
  window.calendarSocket = calendarSocket;
  
  console.log('DSA Calendar | Initialisierung abgeschlossen, user.isGM:', game.user.isGM);
});

Hooks.on('canvasReady', () => {
  if (calendarUI) {
    calendarUI.render();
  }
});

// Export für andere Module
window.DSACalendarAPI = {
  getCalendar: () => dsaCalendar,
  getUI: () => calendarUI,
  getCurrentDate: () => {
    if (calendarUI) {
      return calendarUI.currentDate;
    }
    return game.settings.get("E9L-DSA5-AVENTURIAN-CALENDAR", "currentDate");
  },
  setCurrentDate: async (date) => {
    if (calendarSocket) {
      await calendarSocket.setCurrentDate(date);
    }
  }
};