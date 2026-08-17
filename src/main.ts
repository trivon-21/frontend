import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
/*

i tested using data there are some other issues i need to correct immediately i have evoluation tommorrow please help



in date choosing in inpection scheduling holidays are not shown in the page (i dont want hard code values remeber that)



in inspection report writing there is a place to upload photos.but after uploading there is no option to remove if inspection officer uploaded a wrong photo i need a cross or anything if a photo is wrong he can remove that wehn writing report



there are 2 collection,inspection_reports and inspectionreports in common db the update is happened to inspectionreports but i dont whether it is right one or it is created by me accidently



in generate invoice when i view the detail inspector name is -(dash) fill it with the name he write on the inspection report

and also ac model field is there but not mentioned the model it is blank



also wehen invoice is created it didnt add the price off the ac(didnt even mention this on invoice) and and prices of materials(this is showing 0).it only contains installation charge that is not how it supposed to be.i want all.(but dont include the inspection fee-it is seperately collected)



also in repair invoice it didnt include the material price(this show 0) amount it only put repair charges(here dont add ac model in invoice)

remeber we need to refer inventory to take their prices in common db not my old collections(like l_charges or l_inventoreisbut dont change my other old logic like profit and all )and ac price from products table

in generate invoice for repair ticket ref shows -(dash) and there is a updated field but that is empty(i think this should show the date or time when this is updated)



when i clcik generate invoice in both repair and invoices it landing on login page rather the invoice preview page before creating the invoice.(i htink its routing issue because previously it was working)



in purchase request verification when i view the detail it design is slightly messes i want like the table is not showing it just shoe details like unorganized(but in verified request when i view it show in nice table i want verfication detail viewing alos look like this)



also the things realted to inpction it show full id in table while others shows a nice short version this looks like garbage

in inpection offcier dashboard customer name is not showing it is blank

in buy only it show $ for amount(in verfied payment table ).make sure all amount should be in LKR

repair invoices amoutn is not updated on dahboard of repair

in finnacne office sidbar only when i clcik inspection paymnet verfication,inspection rejected paymnets,inspection verfiied paymnet it landing on login page rather that going to related pages


in invoice pament verified table invoice id not showing ,amount is in $,it is not the invoice amount i think it show($ 5000)-but the cusotmer is not having any invoice with that value i think it accidently showin inpection paymnet,alsodate is not shown(i changed the invoice manually to PAID to test this if it is because that then okay)

in paid invoices order id is long string i want it to be short like other pages

please correct them all immediately when giving code give the entire file to replace.i dont have time to check line by line
(keep in mind to not edit others files and also dont add unwanted collection in common db other what is there)




*/