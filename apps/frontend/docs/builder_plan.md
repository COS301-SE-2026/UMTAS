**The general structure:**

- We have event
- Different things will inherit from events
- For demo 1, the only event we will have is Lectures
- From lectures, we check what do lectures need
  - Lectures need modules
  - For demo 1 it will only be modules

**What the modules have**

- The modules will only have 4 attributes
  - Code
  - Name
  - Colour
  - Description

**How the builder interface should work:**

- **Currently:**
  - Our page just has modules we add. This should be moved a level down and we will add a dropdown for event types, which will only be Lecture for now
  - The "second" tab is the actual preferences. This should be moved to the actual view timetable page where you choose your preferences.
- **What the builder page needs to do**
  - This page should only be adding the modules to the timetable, then selecting colours, adding the name, code and description
  - We will click on a dropdown where we select the event type. Currently for demo 1 the only event is Lecture. After we click on Lecture, it needs to open up the module creation page (what is mostly there but needs to change)
  - These 4 attributes we fill in will be the primary changes.
  - There won't be 3 levels anymore. Only 1 that is heavily expanded.

# The actual view timetable page will be done afterwards
