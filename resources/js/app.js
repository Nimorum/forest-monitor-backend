import './bootstrap';
import { eventBus } from './events';
import { MapController } from './map';
import { DashboardController } from './dashboard';
import { AuthController } from './auth';
import { NavbarController } from './navbar';
import { HistoryController } from './history';
import { AlarmController } from './alarms';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize our controllers (they will automatically subscribe to events)
    new NavbarController();
    new MapController();
    new HistoryController();
    new DashboardController();
    new AuthController();
    new AlarmController();
    eventBus.publish('view:changed', 'map');
});