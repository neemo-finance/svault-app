import { appEventsAtom, Events } from "@/components/provider/AppStateProvider";
import { useAtom } from "jotai";

export const useEvents = () => {
  const [events, setEvents] = useAtom(appEventsAtom);
  const pushEvent = (event: Events, value = Date.now()) =>
    setEvents((previous) => ({ ...previous, [event]: value }));

  return {
    events,
    pushEvent,
  };
};
