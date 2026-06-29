# 🎯 Greentube QA Assignment

## **Registration & Login Test Scenarios**

------------------------------------------------------------------------

**Application Under Test:** `https://www.gametwist.com/en/`

**Prepared By:** **Srinivas Budha**\
**Role:** **Senior QA Automation Engineer**

------------------------------------------------------------------------

## 📚 Table of Contents

1.  Scope
2.  Registration Feature
3.  Login Feature
4.  Unit Test Candidates
5.  Automation Strategy
6.  Automation Decision Matrix
7.  Executive Summary

------------------------------------------------------------------------

# 📌 Scope

This document contains **manual test scenarios written in Gherkin**,
**automation decisions**, and the **rationale** behind those decisions
for the GameTwist **Registration** and **Login** flows.

The objective is to automate **high-value**, **repeatable**,
**business-critical user journeys** while moving **field-level
validations** to **unit/component tests**.

------------------------------------------------------------------------

# 📋 Feature File 1 --- `registration.feature`

> ✅ **Automation Decision**
>
> The **registration flow** is a **business-critical onboarding
> journey** and should always be included in the **regression suite**.

### registration.feature

``` gherkin
@registration
Feature: User Registration

  Background:
    Given the visitor accessing the GameTwist registration form

  @automated @regression @happy-path
  Scenario: New user registers successfully with valid details
    Given the visitor uses a unique email address and nickname
    When the visitor completes registration with valid details
    Then the registration should be completed successfully
    And the user account should be created

  @automated @regression @duplicate-account
  Scenario: Existing user cannot register again with the same email
    Given a registered user account already exists
    When the visitor attempts to register using the same email address
    Then the registration should be rejected
    And the visitor should be informed that the account details are already in use

  @automated @regression @navigation
  Scenario: Visitor starts registration from the login form
    Given the visitor is accessing the GameTwist login form
    When the visitor selects "Register now"
    Then the registration form should be displayed

  @manual @observation
  Scenario: Registration with a valid-format but inaccessible email
    Given the visitor uses an email address with a valid format but no accessible mailbox
    When the visitor completes registration with valid details
    Then the registration may still be completed successfully
    But the email verification link cannot be accessed by the user
```

> ⚠️ **Observation**
>
> Manual testing showed that **email verification does not block
> registration or login**. If this is not the intended behaviour, it
> should be **raised as a defect**.

------------------------------------------------------------------------

# 🔐 Feature File 2 --- `login.feature`

> ✅ **Automation Decision**
>
> The **login flow** is a **core business capability** and should always
> be covered by **regression automation**.

### login.feature

``` gherkin
@login
Feature: User Login

  Background:
    Given the user is accessing the GameTwist login form

  @automated @regression
  Scenario: Existing user logs in successfully with valid credentials
    Given a registered user account exists
    When the user logs in with valid credentials
    Then the user should be logged in successfully

  @automated @regression
  Scenario: Newly registered user can log in without email verification
    Given the user has registered a new account successfully
    And the user has not verified the email address
    When the user logs in
    Then the login should be successful

  @automated @regression
  Scenario: Existing user cannot log in with an incorrect password
    Given a registered user account exists
    When the user enters an incorrect password
    Then the login should be rejected
    And Error message stating "Invalid credentials" should be displayed

  @automated @regression
  Scenario: Unknown user cannot log in
    Given no account exists for the submitted credentials
    When the user attempts to log in
    Then the login should be rejected
    And Error message stating "Invalid credentials" should be displayed

  @automated @regression
  Scenario: Existing user can start the forgotten password flow
    Given a registered user account exists
    When the user selects "Forgotten your password?"
    Then password recovery should start

  @automated @regression
  Scenario: Forgotten password request for an unknown user does not expose account existence
    When an unknown user requests password recovery
    Then a generic response should be displayed
```

> 💡 **Recommendation**
>
> **Clarify** with the **Product Owner** whether **email verification**
> is intended to be **mandatory** or **informational only**.

------------------------------------------------------------------------

# 🧪 Unit / Component Test Candidates

These validations are **better suited to unit/component tests** because
they verify **individual business rules** rather than **end-to-end user
journeys**.

-   **Age validation** logic
-   **Terms & Conditions** state
-   **Email format** validation
-   **Password masking**
-   **Password visibility toggle**
-   **Required field validation**
-   **Empty username/password validation**
-   **Submit button enable/disable state**
-   **Modal visibility**
-   **18+ badge rendering**

------------------------------------------------------------------------

# 🚀 Automation Strategy

**Login** and **Registration** are **business-critical flows** because
they directly impact **user onboarding** and **account access**.

The **core registration**, **login**, **duplicate account prevention**,
**invalid authentication**, and **password recovery** scenarios should
be part of the **automated regression suite**.

**CAPTCHA** should **not block automation**. In test environments it can
be **disabled**, **mocked**, or **bypassed** using a dedicated testing
mechanism.

**Manual exploratory testing** should focus on:

-   **Third-party integrations**
-   **Security behaviour**
-   **Visual verification**
-   **Usability**
-   **Product-policy dependent behaviour**

------------------------------------------------------------------------

# 📊 Automation Decision Matrix

  | **Category**          | **Decision**            |
|:----------------------|:------------------------|
| Registration Flow     | ✅ Automated            |
| Login Flow            | ✅ Automated            |
| Duplicate Account     | ✅ Automated            |
| Forgot Password       | ✅ Automated            |
| CAPTCHA               | 🟡 Mock / Bypass        |
| Email Delivery        | 🟡 Test Mailbox         |
| Unit Validations      | 🧪 Unit Tests           |
| Visual Checks         | 👀 Manual               |
| Exploratory Testing   | 📋 Manual               |
------------------------------------------------------------------------

# 📐 Automation Principles

A scenario is a good automation candidate when it is:

-   ✅ **Business critical**
-   ✅ **Frequently executed**
-   ✅ **Stable**
-   ✅ **Deterministic**
-   ✅ **Easy to maintain**
-   ✅ **High regression value**

Avoid automating scenarios that are:

-   ❌ **One-time checks**
-   ❌ **Better suited for unit/component tests**
-   ❌ **Highly dependent on third-party services**
-   ❌ **Subjective visual inspections**
-   ❌ **Expensive to maintain relative to their value**

----------------------------------------------------




**Conclusion**

The proposed automation strategy prioritizes **high-value business
workflows** while delegating **field-level validation** to
**unit/component tests**. This keeps the **regression suite fast**,
**reliable**, **maintainable**, and aligned with **modern QA engineering
practices**.
