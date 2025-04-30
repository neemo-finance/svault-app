import { Events } from '@/components/provider/AppStateProvider';
import { useEffect, useState } from 'react';
import { useEvent } from 'react-use';
import { useEvents } from './events';

enum PollingRate {
    Fast = 0,
    Slow = 1,
}

const POLLING_INTERVALS = [
    { duration: 120000, interval: 30000 }, // Every 30 secs
    { duration: Infinity, interval: 90000 }, // Every 90 secs
];

export const usePolling = () => {
    const { pushEvent } = useEvents();

    const [isPageFocussed, setIsPageFocussed] = useState(false);

    const handlePageVisibility = async () => {
        const isFocused = document.hasFocus();
        setIsPageFocussed(isFocused);
    };
    useEvent('visibilitychange', handlePageVisibility);

    const setPollingRate = (timer: NodeJS.Timeout, pollingRate: PollingRate) => {
        clearInterval(timer);
        const newTimer = setInterval(() => {
            pushEvent(Events.updateAppDataEvent, Date.now());
        }, POLLING_INTERVALS[pollingRate].interval);
        return newTimer;
    };

    useEffect(() => {
        let pollTimer = setInterval(() => {
            pushEvent(Events.updateAppDataEvent, Date.now());
        }, POLLING_INTERVALS[0].interval);

        // After 2 mins, switch to slower polling rate
        setTimeout(() => {
            pollTimer = setPollingRate(pollTimer, PollingRate.Slow);
        }, POLLING_INTERVALS[0].duration);

        return () => {
            clearInterval(pollTimer);
        };
    }, []);

    useEffect(() => {
        if (isPageFocussed) {
            pushEvent(Events.updateAppDataEvent, Date.now());
        }
    }, [isPageFocussed]);
};
