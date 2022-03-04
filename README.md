# 𝕣𝕒𝕥𝕙𝕖𝕣𝕟𝕠𝕥
[Hosted version - rathernot.website](https://rathernot.website)
## 𝕡𝕣𝕠𝕓𝕝𝕖𝕞
- You have a backend process and you need data from a human
  - to get that data you need a UI, probably a website
  - but making a UI, especially a website, means doing a bunch of crap you don't care about

## 𝕤𝕠𝕝𝕦𝕥𝕚𝕠𝕟
- Since you'd **rather not** make a UI:
  - you'll make a TS class representing the data you want and give it to us
  - we'll take that class, make a form users can fill out to make an instance of that class, then drop the instances onto a queue or webhook you own.

**You give us a class and we give you data from users.**  Sleep well knowing you've dodged webpack another day.

## 𝕕𝕖𝕞𝕠 *(aspirational)*

#### You write
```typescript
import RatherNot from 'rathernot'
import { ShortString, Choice } from 'rathernot/forms';
import { SQSQueue, AsyncForm } from 'rathernot/delivery';

class ProvisioningRequest implements AsyncForm {

  //form fields
  userName = ShortString();
  userCostCenter = ShortString();
  accountLifespan = Choice(["temporary_1M", "temporary_1Y", "permanent"]);
  ownerEmail = ShortString();
  ownerPosixGroup = ShortString();

  //where we deliver the instances
  getDelivery () {
    return new SQSQueue("aws.sqs.arn.account-provisioning-requests.aws.com");
  }
}

export default RatherNot(new ProvisioningRequest());
```

#### You ship
```sh
$ rathernot ProvisioningRequest.ts
```

#### You get
Messages like this dropped on a queue near you
```
{
  "userName": "Bridgett",
  "userCostCenter": "345345",
  "accountLifespan": "temporary_1Y",
  "ownerEmail": "bridgett@megacorp.com",
  "ownerPosixGroup": "bridgett-resources"
}
```

## 𝕗𝕒𝕢
#### Is this...

##### a form builder like Google Forms/Forms.io?
Nope--those tools target non-technical users and generally provide software that is less permanent and maintainable than what rathernot provides.

##### a CMS?
Again, the target user is software engineers that *would make a website front-end for their software but use rathernot instead*.  Imagine your generic software tool, now drop the front-end and replace it with a long-lived rathernot built UI. 

##### "no code"/"low code"?
Nah dawg you're writing a class.  It's *only* code.  That means it can be developed, versioned, deployed, and extended in the normal codely ways.

#### Can I customize my UI experience?
Users can have any ui theme they like, as long as its rathernot's default theme.  Long term, we think the theme experience will look something like:

```
import { Dark } from 'rathernot/themes/material'
Rathernot(Dark)
...
```

#### I already have a website.  This product isn't for me.
Slow down!  You can weave rathernot uis into your broader website strategy.  Folding in a small rathernot ui works great for:
- internal control plane uis
- lightweight proof-of-concepts
- non-critical-path features (ex: account management, abuse reporting forms, moderation actions)
- partially automated systems that need human intervention in exceptional cases
- stopgap heroics
- projects staffed by developers inexperienced in web development

#### But like I could still just make a website.  Nobody ever got fired for making a website.  Why bother with this new thing?
Yes, oh mighty developer, you could just make a website.  Whatever you were doing before you realized you needed a UI is surely not that important so absolutely, drop everything and:
- make a react site
- set up website infra
- set up a CI/CD pipeline for your website
- write automated tests
- figure out how to get your website connected to your broader system
- deploy your website
- ☁ make your website webscale ☁
- add alarms and monitoring for your website
- oh crap your process is asynchronous but websites are synchronous, so you have to invent a bunch of novel synchronous concepts that website users manipulate via CRUD ops then make a translation layer that takes those synchronous concepts and maps them back to asynchronous concepts your backend can work with while also keeping the synchronous things up to date with the state of the backend work so now your website needs a database to manage its own state...

🙄😩 personally, I'd rather not.

#### But my website will be nicer.  My website will be a lot more than just a derpy Google Form.  My website will have a header, and a footer, and a settings page, and an about us page.  How can you compete with that?
Ok, for sure a bespoke UI is nicer.  We're thinking about how to make this tool provide a "serious" user experience. Today, this is not a lead-to-gold converter, its a lead-to-copper converter. One day you'll be able to show UIs built with this tool to users and feel great about it.

Until that day, consider--do you really need a custom luxury experience?  Or will a bit of utilitarian swagger get you where you need to be?

### Why do you hate websites so much
Look, web development is complex, expensive, and slow.  If having a great website is in your critical path to success, then sure, party on.  But does an internal automation application that sees 5 users a week need a nextjs SSR lambo-site?

One way to deal with web development complexity might be to design better/simpler tools.  The best way to deal with web development complexity is to not do it at all!

### Does this actually work?
**Absoutely not** (as of 2-20-22 [two days before twosday! {blessed}])

## 𝕔𝕠𝕠𝕝 𝕥𝕙𝕚𝕟𝕘𝕤 𝕥𝕙𝕚𝕤 𝕨𝕚𝕝𝕝 𝕕𝕠 𝕖𝕧𝕖𝕟𝕥𝕦𝕒𝕝𝕝𝕪 (𝕣𝕠𝕦𝕘𝕙 𝕡𝕣𝕚𝕠 𝕠𝕣𝕕𝕖𝕣)
- persistent form responses with lifecycle events that you can write to
- hook up some kind of graphql thing that queries data from persistent forms
- put forms behind authX
- integrate forms into existing UIs
- Webhooks so people don't have to pay AMZN.  Even though SQS is fantastic.
^ MVP

- forms with data from service calls (ex: a dropdown with results from a service request)
- excel file parsing & generation--everybody loves excel!  Have you ever seen the joy of a user's face when you tell them they can just upload their excel spreadsheet?  That they don't have to learn how to use your webapp?
- meet users where they are- google/azure/on-prem-container?
- form themes / data type extensions / form plugins
