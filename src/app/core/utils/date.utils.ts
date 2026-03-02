
import { Timing, TimingRepeat, Period } from 'fhir/r4';

export function displayDate(dateString?: string): string | undefined {
  if (dateString === undefined || dateString === null) {
    return undefined
  }
  else {
    // If time is not included, then parse only Year Month Day parts
    // In JavaScript, January is 0. Subtract 1 from month Int.
    const parts = dateString!.split('-');
    const jsDate: Date = (dateString?.includes('T'))
      ? new Date(dateString!)
      : new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))

    return jsDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    })
  }
}

export function displayTiming(timing: Timing | undefined): string | undefined {
  const boundsPeriod = (timing?.repeat as TimingRepeat)?.boundsPeriod
  const startDate = displayDate(boundsPeriod?.start)
  const endDate = displayDate(boundsPeriod?.end)
  return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
}

export function displayPeriod(period: Period | undefined): string | undefined {
  const startDate = displayDate(period?.start)
  const endDate = displayDate(period?.end)
  return (startDate ?? '') + ((endDate !== undefined) ? ` until ${endDate}` : '')
}

