import { gql } from '@apollo/client';

export const PARSE_ROSTER = gql`
  mutation ParseRoster($fileId: uuid!) {
    parseRoster(fileId: $fileId) {
      sourceFileId
      entries {
        flightNumber
        departureAirport
        arrivalAirport
        layoverCity
        layoverStart
        layoverEnd
      }
      homeBase
      skippedDuties
      trips {
        legs {
          flightNumber
          departureAirport
          arrivalAirport
          serviceDate
          scheduledDeparture
          scheduledArrival
          deadhead
          lowConfidence
        }
        layovers {
          flightNumber
          departureAirport
          arrivalAirport
          layoverCity
          layoverStart
          layoverEnd
        }
      }
    }
  }
`;

/** Same as SUBMIT_REPORT with the context snapshot (source screen, relationship). Needs the report_context backend. */
export const SUBMIT_REPORT_WITH_CONTEXT = gql`
  mutation SubmitReportWithContext(
    $reason: String!
    $details: String
    $reportedUserId: uuid
    $reportedMessageId: uuid
    $reportedEventId: uuid
    $context: jsonb
  ) {
    submitReport(
      reason: $reason
      details: $details
      reportedUserId: $reportedUserId
      reportedMessageId: $reportedMessageId
      reportedEventId: $reportedEventId
      context: $context
    ) {
      reportId
      status
    }
  }
`;

export const SUBMIT_REPORT = gql`
  mutation SubmitReport(
    $reason: String!
    $details: String
    $reportedUserId: uuid
    $reportedMessageId: uuid
    $reportedEventId: uuid
  ) {
    submitReport(
      reason: $reason
      details: $details
      reportedUserId: $reportedUserId
      reportedMessageId: $reportedMessageId
      reportedEventId: $reportedEventId
    ) {
      reportId
      status
    }
  }
`;
