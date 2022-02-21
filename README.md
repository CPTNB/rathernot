# 𝕣𝕒𝕥𝕙𝕖𝕣𝕟𝕠𝕥
[Hosted version - rathernot.io](https://rathernot.io)
## 𝕡𝕣𝕠𝕓𝕝𝕖𝕞
- You have a backend process
- You need data from a human
  - to get that data you need a UI, probably a website
  - but making a UI, especially a website, means doing a bunch of crap you don't care about

## 𝕤𝕠𝕝𝕦𝕥𝕚𝕠𝕟
- Since you'd **rather not** make a UI:
  - you're gonna make a TS class representing the data you want and give it to us
  - we're gonna take that class, make a form users can fill out to make an instance of that class, then drop the instances onto a queue you own.

**You give us a class and we give you data from users.**  Sleep well knowing you've dodged webpack for another day.

## 𝕕𝕖𝕞𝕠 *(aspirational)*

#### You write
```typescript
import { AsyncForm } from 'rathernot/ui';
import { AWSQueue } from 'rathernot/delivery';

class ProvisioningRequest() implements AsyncForm {

  //form fields
  userName: string;
  userCostCenter: string;
  accountLifespan: "temporary_1M"|"temporary_1Y"|"permanent";
  ownerEmail: string;
  ownerPosixGroup: string;

  //where we deliver the instances
  getDelivery ({stage}) {
    const deliveryQueue = stage.isProduction()
      ? "aws.sqs.arn.production.amazone.com"
      : "aws.sqs.arn.beta.amazone.com"
    return new AWSQueue(deliveryQueue);
  }
}
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
#### Is this "No Code"?
Nah dawg you're writing a class.  It's *only* code.  Our Dev CX is a CLI.  This project is for back-end software teams.

#### Can I customize my forms experience?
Eventually maybe 🤷‍♀️
It kinda sounds like you'd rather make a UI.

#### How can I get data from humans?
Today, using a form a la Google forms.  Tomorrow: forms, excel parsing, bespoke UI plugins, who knows!  The number of UIs you won't have to write is endless!

#### Why Typescript it's dumb why not Rust that's a safe language
Well we're not going to actually *run* your TS class, so don't worry it'll be fine 😉

#### How is this different than Google forms?
1. Its open source
2. Its way simpler
3. Long term, we're hoping to have a bigger scope of what kinds of UIs you're not writing

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
Ok, for sure a bespoke UI is nicer.  We are constantly thinking about how to make this tool provide a "serious" user experience. Today, this is not a lead-to-gold converter, its a lead-to-copper converter. One day you'll be able to show UIs built with this tool to customers and feel great about it.

Until that day, consider--do you really need a custom luxury experience?  Or will a bit of utilitarian swagger get you where you need to be?

### Does this actually work?
**Absoutely not** (as of 2-20-22 [two days before twosday! {blessed}])



## 𝕔𝕠𝕠𝕝 𝕥𝕙𝕚𝕟𝕘𝕤 𝕥𝕙𝕚𝕤 𝕨𝕚𝕝𝕝 𝕕𝕠 𝕖𝕧𝕖𝕟𝕥𝕦𝕒𝕝𝕝𝕪 (𝕣𝕠𝕦𝕘𝕙 𝕡𝕣𝕚𝕠 𝕠𝕣𝕕𝕖𝕣)
- work
- let users read data so you don't have to make a read UI either
- let devs supply form validation code
- put forms behind authX
- synchronous delivery mechanisms (ex: a service call instead of a queue msg)
- forms with data from service calls (ex: a dropdown with results from a service request)
- persistent form responses with lifecycle events that you can write to
- integrate forms into existing UIs
- form themes / data type extensions / form plugins
- excel file parsing--everybody loves excel!
