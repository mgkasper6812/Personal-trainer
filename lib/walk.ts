/** The post-dinner walk is ticked on the Tonight card and stored in the day's habit log. */
export const WALK = "Walk after dinner";
export const walkedOn = (log: string[]) => log.some((h) => /walk/i.test(h));
