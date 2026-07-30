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
