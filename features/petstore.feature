Feature: Swagger Petstore pet API
  The pet API should support CRUD operations and predictable error handling.

  # Requirement IDs make scenarios traceable in test reports.
  @api @crud @PET-001
  Scenario: Create, read, update, and verify a pet
    Given I create a new pet with dynamic data
    When I read the created pet
    And I update the created pet
    Then the created, read, and updated pet responses should be consistent

  @api @delete @PET-002
  Scenario: Delete a pet and verify it cannot be read
    Given I create a new pet with dynamic data
    When I delete the created pet
    Then reading the deleted pet should return not found

  @api @negative @PET-003
  Scenario: Invalid pet ID returns an error
    When I request a pet using invalid ID "invalid-id"
    Then the API should return an error response

  @api @negative @PET-004
  Scenario: Invalid pet request body is rejected
    When I create a pet with an invalid request body
    Then the API should return a request validation error

  @api @negative @PET-005
  Scenario: Missing pet request body is rejected
    When I create a pet without a request body
    Then the API should return a request validation error

  @api @negative @PET-006
  Scenario: Unsupported pet HTTP method returns an error
    When I call an unsupported method for a pet
    Then the API should return a method or validation error
