import './bootstrap';
import { eventBus } from './events';
import { MapController } from './map';
import { DashboardController } from './dashboard';
import { AuthController } from './auth';
import { NavbarController } from './navbar';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize our controllers (they will automatically subscribe to events)
    new NavbarController();
    new MapController();
    new DashboardController();
    new AuthController();

    eventBus.publish('view:changed', 'map');
});