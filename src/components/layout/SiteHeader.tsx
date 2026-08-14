import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/lib/user";
import { useI18n } from "@/lib/i18n";
import { LogoLink } from "@/components/Logo";
import { useChromeVisibility } from "@/lib/useChromeVisibility";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Caret } from "@/components/ui";
import { isAlwaysPublicPath, isDualBrowsePath } from "@/lib/marketingPaths";

const NAVCDN = "https://static.pocketpills.com/acq-web/redesign/navbar";

/* ── icons (paths lifted from production) ─────────────── */
const W = { fill: "white" } as const;
function Icon({ id }: { id: string }) {
  switch (id) {
    case "weight":
      return (
        <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden>
          <path d="M35.933 3.63769C33.867 1.37154 6.57839 1.08612 4.17882 3.85046C1.77925 6.61479 6.22406 34.6485 7.50539 36.6963C8.78672 38.744 32.5745 38.4982 33.291 36.6963C34.0075 34.8943 37.9989 5.90385 35.933 3.63769Z" stroke="white" strokeWidth="2.54158" />
          <path d="M20.1775 7.52539C17.3664 7.52474 10.5011 9.0266 11.2723 10.2819C12.0435 11.5372 15.4092 15.4758 16.0544 15.4758C16.6995 15.4758 18.337 14.4701 19.8846 14.4584C21.4322 14.4467 23.445 15.4758 23.8345 15.4758C24.2241 15.4758 28.3157 11.3301 28.7827 10.2819C29.2497 9.23366 22.9886 7.52604 20.1775 7.52539Z" stroke="white" strokeWidth="2.54158" />
          <line x1="21.2806" y1="23.6575" x2="21.2806" y2="30.903" stroke="white" strokeWidth="2.54158" strokeLinecap="round" />
        </svg>
      );
    case "hair":
      return (
        <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden>
          <path d="M29.3118 1.02734C29.3663 0.986607 29.4432 0.990553 29.4944 1.04199C29.5421 1.08994 29.5481 1.1677 29.5051 1.22461C29.4188 1.33869 27.1198 4.43296 25.2649 9.14551C23.4091 13.8605 21.961 20.2915 23.7288 27.002C24.0811 28.3393 23.8309 29.6154 23.1233 30.5342C22.431 31.4317 21.3118 31.9727 19.8821 31.9727C17.8896 31.9726 16.0959 30.2288 15.9387 27.6133C15.7199 23.9668 16.9808 18.8563 19.386 13.8359C21.7853 8.82805 25.2551 4.05431 29.3118 1.02832V1.02734Z" stroke="white" strokeWidth="2" />
          <path {...W} d="M27.159 28.8457C29.9602 28.8457 34.0196 29.6098 35.1817 29.8884C35.7539 30.0263 36.1072 30.6014 35.9707 31.1743C35.8335 31.7479 35.2578 32.1011 34.6856 31.9625C33.7509 31.7379 30.5772 31.1366 28.0731 31.0044C27.26 35.2421 24.3002 37.7391 19.9999 37.7391C15.7011 37.7391 12.7413 35.2428 11.9268 31.0051C9.52358 31.1359 6.37904 31.7066 5.3157 31.9625C4.74351 32.0976 4.16777 31.7479 4.02988 31.175C3.89198 30.6021 4.24454 30.0263 4.81672 29.8884C5.92982 29.6212 10.0645 28.8457 12.8401 28.8457C13.3839 28.8457 13.8409 29.2551 13.8999 29.7967C14.3079 33.5433 16.4744 35.6067 19.9992 35.6067C23.5247 35.6067 25.6912 33.5433 26.0992 29.7967C26.1582 29.2551 26.6146 28.8457 27.159 28.8457Z" />
        </svg>
      );
    case "ed":
      return (
        <svg width="30" height="30" viewBox="0 0 40 40" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7.49996 27.4996C4.99996 29.5996 4.16663 35.8329 4.16663 35.8329C4.16663 35.8329 10.4 34.9996 12.5 32.4996C13.6833 31.0996 13.6666 28.9496 12.35 27.6496C11.7021 27.0312 10.8488 26.674 9.95367 26.6463C9.05856 26.6186 8.18475 26.9225 7.49996 27.4996Z" />
          <path d="M20 24.9991L15 19.9991C15.8869 17.6982 17.0037 15.4925 18.3333 13.4158C20.2753 10.3108 22.9794 7.75419 26.1883 5.98926C29.3973 4.22433 33.0044 3.30973 36.6667 3.33244C36.6667 7.86578 35.3667 15.8324 26.6667 21.6658C24.5615 22.997 22.3281 24.1137 20 24.9991Z" />
          <path d="M15 19.9999H6.66663C6.66663 19.9999 7.58329 14.9499 9.99996 13.3332C12.7 11.5332 18.3333 13.3332 18.3333 13.3332" />
          <path d="M20 24.9993V33.3327C20 33.3327 25.05 32.416 26.6667 29.9993C28.4667 27.2993 26.6667 21.666 26.6667 21.666" />
        </svg>
      );
    case "birth":
      return (
        <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden>
          <rect x="20.7749" y="-0.111328" width="20" height="34.9313" rx="3.61847" transform="rotate(32 20.7749 -0.111328)" stroke="white" strokeWidth="2" />
          <path {...W} d="M25.6173 9.48538C24.7393 10.8905 22.8885 11.3178 21.4834 10.4398C20.0783 9.56177 19.651 7.71096 20.529 6.30586C21.407 4.90077 23.2578 4.47348 24.6629 5.35148C26.068 6.22948 26.4953 8.08029 25.6173 9.48538ZM21.9283 7.18023C21.5332 7.81252 21.7255 8.64539 22.3578 9.04049C22.9901 9.43559 23.8229 9.2433 24.218 8.61101C24.6131 7.97872 24.4208 7.14586 23.7886 6.75076C23.1563 6.35566 22.3234 6.54794 21.9283 7.18023Z" />
          <path {...W} d="M21.3961 16.2412C20.5181 17.6463 18.6673 18.0736 17.2622 17.1956C15.8571 16.3176 15.4298 14.4668 16.3078 13.0617C17.1858 11.6566 19.0366 11.2293 20.4417 12.1073C21.8468 12.9853 22.2741 14.8361 21.3961 16.2412ZM17.7071 13.9361C17.312 14.5684 17.5043 15.4012 18.1366 15.7963C18.7689 16.1914 19.6017 15.9992 19.9968 15.3669C20.3919 14.7346 20.1997 13.9017 19.5674 13.5066C18.9351 13.1115 18.1022 13.3038 17.7071 13.9361Z" />
          <path {...W} d="M17.1749 22.9951C16.2969 24.4002 14.4461 24.8275 13.041 23.9495C11.6359 23.0715 11.2086 21.2207 12.0866 19.8156C12.9646 18.4105 14.8154 17.9832 16.2205 18.8612C17.6256 19.7392 18.0529 21.5901 17.1749 22.9951ZM13.4859 20.69C13.0908 21.3223 13.2831 22.1552 13.9154 22.5503C14.5477 22.9454 15.3805 22.7531 15.7756 22.1208C16.1707 21.4885 15.9785 20.6556 15.3462 20.2605C14.7139 19.8654 13.881 20.0577 13.4859 20.69Z" />
          <path {...W} d="M12.9536 29.751C12.0756 31.1561 10.2248 31.5834 8.81971 30.7054C7.41461 29.8274 6.98732 27.9766 7.86532 26.5715C8.74332 25.1664 10.5941 24.7391 11.9992 25.6171C13.4043 26.4951 13.8316 28.3459 12.9536 29.751ZM9.2646 27.4459C8.8695 28.0781 9.06178 28.911 9.69407 29.3061C10.3264 29.7012 11.1592 29.5089 11.5543 28.8766C11.9494 28.2443 11.7571 27.4115 11.1249 27.0164C10.4926 26.6213 9.6597 26.8136 9.2646 27.4459Z" />
          <path {...W} d="M32.1352 13.4287C31.2573 14.8338 29.4064 15.2611 28.0013 14.3831C26.5963 13.5051 26.169 11.6543 27.047 10.2492C27.925 8.84413 29.7758 8.41684 31.1809 9.29484C32.586 10.1728 33.0132 12.0236 32.1352 13.4287ZM28.4462 11.1236C28.0511 11.7559 28.2434 12.5887 28.8757 12.9838C29.508 13.3789 30.3409 13.1867 30.736 12.5544C31.1311 11.9221 30.9388 11.0892 30.3065 10.6941C29.6742 10.299 28.8413 10.4913 28.4462 11.1236Z" />
          <path {...W} d="M27.9141 20.1846C27.0361 21.5897 25.1852 22.017 23.7802 21.139C22.3751 20.261 21.9478 18.4102 22.8258 17.0051C23.7038 15.6 25.5546 15.1727 26.9597 16.0507C28.3648 16.9287 28.7921 18.7795 27.9141 20.1846ZM24.225 17.8794C23.8299 18.5117 24.0222 19.3446 24.6545 19.7397C25.2868 20.1348 26.1197 19.9425 26.5148 19.3102C26.9099 18.6779 26.7176 17.8451 26.0853 17.45C25.453 17.0549 24.6201 17.2472 24.225 17.8794Z" />
          <path {...W} d="M23.6929 26.9385C22.8149 28.3436 20.9641 28.7709 19.559 27.8929C18.1539 27.0149 17.7266 25.1641 18.6046 23.759C19.4826 22.3539 21.3334 21.9266 22.7385 22.8046C24.1436 23.6826 24.5709 25.5334 23.6929 26.9385ZM20.0039 24.6334C19.6088 25.2656 19.801 26.0985 20.4333 26.4936C21.0656 26.8887 21.8985 26.6964 22.2936 26.0641C22.6887 25.4318 22.4964 24.599 21.8641 24.2039C21.2318 23.8088 20.399 24.0011 20.0039 24.6334Z" />
          <path {...W} d="M19.4716 33.6944C18.5936 35.0995 16.7427 35.5267 15.3377 34.6487C13.9326 33.7708 13.5053 31.9199 14.3833 30.5148C15.2613 29.1098 17.1121 28.6825 18.5172 29.5605C19.9223 30.4385 20.3496 32.2893 19.4716 33.6944ZM15.7825 31.3892C15.3874 32.0215 15.5797 32.8544 16.212 33.2495C16.8443 33.6446 17.6772 33.4523 18.0723 32.82C18.4674 32.1877 18.2751 31.3548 17.6428 30.9597C17.0105 30.5646 16.1776 30.7569 15.7825 31.3892Z" />
        </svg>
      );
    case "plus":
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden>
          <path {...W} d="M10.125 16.875C9.50368 16.875 9 17.3787 9 18C9 18.6213 9.50368 19.125 10.125 19.125H16.875V25.875C16.875 26.4963 17.3787 27 18 27C18.6213 27 19.125 26.4963 19.125 25.875V19.125H25.875C26.4963 19.125 27 18.6213 27 18C27 17.3787 26.4963 16.875 25.875 16.875H19.125V10.125C19.125 9.50368 18.6213 9 18 9C17.3787 9 16.875 9.50368 16.875 10.125V16.875H10.125Z" />
          <path {...W} fillRule="evenodd" clipRule="evenodd" d="M16.0366 0.5625C13.5594 0.562494 11.6313 0.56249 10.0847 0.688854C8.51437 0.817156 7.23848 1.08131 6.09085 1.66606C4.18571 2.63678 2.63678 4.18571 1.66606 6.09085C1.08131 7.23848 0.817156 8.51437 0.688854 10.0847C0.56249 11.6313 0.562494 13.5594 0.5625 16.0366V19.9634C0.562494 22.4406 0.56249 24.3687 0.688854 25.9153C0.817156 27.4856 1.08131 28.7615 1.66606 29.9092C2.63678 31.8143 4.18571 33.3632 6.09085 34.3339C7.23848 34.9187 8.51437 35.1828 10.0847 35.3111C11.6313 35.4375 13.5594 35.4375 16.0366 35.4375H19.9634C22.4406 35.4375 24.3687 35.4375 25.9153 35.3111C27.4856 35.1828 28.7615 34.9187 29.9092 34.3339C31.8143 33.3632 33.3632 31.8143 34.3339 29.9092C34.9187 28.7615 35.1828 27.4856 35.3111 25.9153C35.4375 24.3687 35.4375 22.4406 35.4375 19.9634V16.0366C35.4375 13.5594 35.4375 11.6313 35.3111 10.0847C35.1828 8.51437 34.9187 7.23848 34.3339 6.09085C33.3632 4.18571 31.8143 2.63678 29.9092 1.66606C28.7615 1.08131 27.4856 0.817156 25.9153 0.688854C24.3687 0.56249 22.4406 0.562494 19.9634 0.5625H16.0366ZM7.11232 3.67082C7.8899 3.27463 8.83673 3.04832 10.2679 2.93138C11.7123 2.81337 13.5487 2.8125 16.0875 2.8125H19.9125C22.4513 2.8125 24.2877 2.81337 25.7321 2.93138C27.1633 3.04832 28.1101 3.27463 28.8877 3.67082C30.3695 4.42583 31.5742 5.63055 32.3292 7.11232C32.7254 7.8899 32.9517 8.83673 33.0686 10.2679C33.1866 11.7123 33.1875 13.5487 33.1875 16.0875V19.9125C33.1875 22.4513 33.1866 24.2877 33.0686 25.7321C32.9517 27.1633 32.7254 28.1101 32.3292 28.8877C31.5742 30.3695 30.3695 31.5742 28.8877 32.3292C28.1101 32.7254 27.1633 32.9517 25.7321 33.0686C24.2877 33.1866 22.4513 33.1875 19.9125 33.1875H16.0875C13.5487 33.1875 11.7123 33.1866 10.2679 33.0686C8.83673 32.9517 7.8899 32.7254 7.11232 32.3292C5.63055 31.5742 4.42583 30.3695 3.67082 28.8877C3.27463 28.1101 3.04832 27.1633 2.93138 25.7321C2.81337 24.2877 2.8125 22.4513 2.8125 19.9125V16.0875C2.8125 13.5487 2.81337 11.7123 2.93138 10.2679C3.04832 8.83673 3.27463 7.8899 3.67082 7.11232C4.42583 5.63055 5.63055 4.42583 7.11232 3.67082Z" />
        </svg>
      );
    case "searchprices":
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden>
          <path {...W} d="M2.25 18C2.25 9.30151 9.30151 2.25 18 2.25C22.3823 2.25 26.345 4.03836 29.2014 6.92791L25.3336 6.85563C24.7123 6.84402 24.1993 7.3382 24.1877 7.95941C24.1761 8.58062 24.6703 9.09363 25.2915 9.10524L31.7043 9.22507C32.0099 9.23079 32.3047 9.1119 32.5208 8.89577C32.7369 8.67963 32.8558 8.38486 32.8501 8.07925L32.7303 1.66648C32.7187 1.04527 32.2057 0.551087 31.5844 0.562696C30.9632 0.574305 30.4691 1.08731 30.4807 1.70852L30.5439 5.09064C27.3032 1.94125 22.8773 0 18 0C8.05888 0 0 8.05888 0 18C0 18.6213 0.50368 19.125 1.125 19.125C1.74632 19.125 2.25 18.6213 2.25 18Z" />
          <path {...W} d="M36 18C36 17.3787 35.4963 16.875 34.875 16.875C34.2537 16.875 33.75 17.3787 33.75 18C33.75 26.6985 26.6985 33.75 18 33.75C13.9021 33.75 10.1715 32.1864 7.36899 29.621L11.7881 29.7036C12.4094 29.7152 12.9224 29.221 12.934 28.5998C12.9456 27.9786 12.4514 27.4656 11.8302 27.454L5.41741 27.3341C5.11181 27.3284 4.81703 27.4473 4.6009 27.6634C4.38477 27.8796 4.26588 28.1743 4.27159 28.48L4.39143 34.8927C4.40304 35.5139 4.91604 36.0081 5.53726 35.9965C6.15847 35.9849 6.65265 35.4719 6.64104 34.8507L6.58626 31.9192C9.69191 34.4685 13.668 36 18 36C27.9411 36 36 27.9411 36 18Z" />
          <path {...W} fillRule="evenodd" clipRule="evenodd" d="M11.25 7.875C10.6287 7.875 10.125 8.37868 10.125 9V22.05C10.125 22.6713 10.6287 23.175 11.25 23.175C11.8713 23.175 12.375 22.6713 12.375 22.05V16.8419H13.9204L19.4 22.3215L15.517 26.2045C15.0777 26.6438 15.0777 27.3562 15.517 27.7955C15.9563 28.2348 16.6687 28.2348 17.108 27.7955L20.991 23.9125L24.7983 27.7198C25.2376 28.1591 25.9499 28.1591 26.3892 27.7198C26.8286 27.2805 26.8286 26.5681 26.3892 26.1288L22.582 22.3215L26.108 18.7955C26.5473 18.3562 26.5473 17.6438 26.108 17.2045C25.6687 16.7652 24.9563 16.7652 24.517 17.2045L20.991 20.7305L17.0687 16.8083C19.2843 16.5361 21 14.6477 21 12.3585C21 9.88231 18.9927 7.875 16.5165 7.875H11.25ZM16.5165 14.5919H12.375V10.125H16.5165C17.75 10.125 18.75 11.125 18.75 12.3585C18.75 13.592 17.75 14.5919 16.5165 14.5919Z" />
        </svg>
      );
    case "transfer":
      return (
        <svg width="28" height="28" viewBox="0 0 36 37" fill="none" aria-hidden>
          <path {...W} fillRule="evenodd" clipRule="evenodd" d="M5.0625 1.875C3.19854 1.875 1.6875 3.38604 1.6875 5.25V8.625C1.6875 10.1814 2.74103 11.4917 4.17385 11.8818C4.02133 12.2665 3.9375 12.686 3.9375 13.125V32.25C3.9375 34.114 5.44854 35.625 7.3125 35.625H18.5625C20.4265 35.625 21.9375 34.114 21.9375 32.25V27.75C21.9375 27.1287 21.4338 26.625 20.8125 26.625C20.1912 26.625 19.6875 27.1287 19.6875 27.75V32.25C19.6875 32.8713 19.1838 33.375 18.5625 33.375H7.3125C6.69118 33.375 6.1875 32.8713 6.1875 32.25V13.125C6.1875 12.5037 6.69118 12 7.3125 12H18.5625C19.1838 12 19.6875 12.5037 19.6875 13.125V17.0114C19.6875 17.6327 20.1912 18.1364 20.8125 18.1364C21.4338 18.1364 21.9375 17.6327 21.9375 17.0114V13.125C21.9375 12.686 21.8537 12.2665 21.7011 11.8818C23.134 11.4917 24.1875 10.1814 24.1875 8.625V5.25C24.1875 3.38604 22.6765 1.875 20.8125 1.875H5.0625ZM20.8125 9.75C21.4338 9.75 21.9375 9.24632 21.9375 8.625V5.25C21.9375 4.62868 21.4338 4.125 20.8125 4.125H5.0625C4.44118 4.125 3.9375 4.62868 3.9375 5.25V8.625C3.9375 9.24632 4.44118 9.75 5.0625 9.75H20.8125Z" />
          <path {...W} d="M26.7254 15.1605C27.1545 14.7112 27.8666 14.6948 28.316 15.1239L35.0895 21.5927C35.3118 21.8049 35.4375 22.0989 35.4375 22.4062C35.4375 22.7136 35.3118 23.0076 35.0895 23.2198L28.316 29.6886C27.8666 30.1177 27.1545 30.1013 26.7254 29.652C26.2963 29.2027 26.3127 28.4905 26.762 28.0614L31.5056 23.5312H14.0625C13.4412 23.5312 12.9375 23.0276 12.9375 22.4062C12.9375 21.7849 13.4412 21.2812 14.0625 21.2812H31.5056L26.762 16.7511C26.3127 16.322 26.2963 15.6099 26.7254 15.1605Z" />
        </svg>
      );
    default: // prescription circle
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden>
          <path {...W} d="M16.8948 6.89042C16.8948 6.2691 16.3912 5.76542 15.7698 5.76542C15.1485 5.76542 14.6448 6.2691 14.6448 6.89042V9.25374H13.9138C11.7675 9.25374 10.0276 10.9937 10.0276 13.14C10.0276 15.2863 11.7675 17.0263 13.9138 17.0263H17.7573C18.5884 17.0263 19.2621 17.7 19.2621 18.531C19.2621 19.3621 18.5884 20.0358 17.7573 20.0358H11.1526C10.5313 20.0358 10.0276 20.5395 10.0276 21.1608C10.0276 21.7821 10.5313 22.2858 11.1526 22.2858H14.6448V24.6491C14.6448 25.2704 15.1485 25.7741 15.7698 25.7741C16.3912 25.7741 16.8948 25.2704 16.8948 24.6491V22.2858H17.7573C19.831 22.2858 21.5121 20.6047 21.5121 18.531C21.5121 16.4573 19.831 14.7763 17.7573 14.7763H13.9138C13.0102 14.7763 12.2776 14.0437 12.2776 13.14C12.2776 12.2363 13.0102 11.5037 13.9138 11.5037H20.3871C21.0084 11.5037 21.5121 11.0001 21.5121 10.3787C21.5121 9.75741 21.0084 9.25374 20.3871 9.25374H16.8948V6.89042Z" />
          <path {...W} fillRule="evenodd" clipRule="evenodd" d="M0.0826416 15.7697C0.0826416 7.10595 7.10601 0.0825806 15.7698 0.0825806C24.4335 0.0825806 31.4569 7.10595 31.4569 15.7697C31.4569 19.6967 30.014 23.2866 27.6293 26.0383L35.3895 33.7985C35.8289 34.2378 35.8289 34.9501 35.3895 35.3895C34.9502 35.8288 34.2379 35.8288 33.7985 35.3895L26.0384 27.6293C23.2867 30.0139 19.6967 31.4568 15.7698 31.4568C7.10601 31.4568 0.0826416 24.4335 0.0826416 15.7697ZM15.7698 2.33258C8.34865 2.33258 2.33264 8.34859 2.33264 15.7697C2.33264 23.1908 8.34865 29.2068 15.7698 29.2068C23.1909 29.2068 29.2069 23.1908 29.2069 15.7697C29.2069 8.34859 23.1909 2.33258 15.7698 2.33258Z" />
        </svg>
      );
  }
}

/* ── small building blocks ────────────────────────────── */
function Chevron() {
  return <Caret size={16} className="opacity-70" />;
}
function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block transition-transform group-hover/u:translate-x-1" aria-hidden>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function UnderlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group/u inline-flex w-fit items-center gap-2 border-b border-current transition-opacity hover:opacity-70 pb-0.5 text-sm font-medium text-[color:var(--pp-primary-950)]">
      {children} <ArrowRight />
    </Link>
  );
}
function Tag({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="w-max rounded-full border border-line px-3 py-1 text-xs font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]">
      {children}
    </Link>
  );
}
function DropTile({ to, icon, label, chip, hover }: { to: string; icon: string; label: string; chip: string; hover: string }) {
  return (
    <Link to={to} className={"flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all duration-200 " + hover}>
      <span className="flex shrink-0 items-center justify-center rounded-lg p-2" style={{ backgroundColor: chip }}>
        <Icon id={icon} />
      </span>
      <p className="text-sm font-medium text-[color:var(--pp-primary-950)]">{label}</p>
    </Link>
  );
}
function FaqList({ items }: { items: { label: string; slug: string }[] }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">{t("mega.frequentlyAsked")}</h2>
      <ul className="flex list-none flex-col gap-2">
        {items.map(({ label, slug }) => (
          <li key={slug}>
            <Link
              to={`/questions#${slug}`}
              className="text-sm text-ink-secondary transition-colors hover:text-[color:var(--pp-violet)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <UnderlineLink to="/questions">{t("mega.seeAllFaqs")}</UnderlineLink>
    </div>
  );
}

/* ── dropdown panels ──────────────────────────────────── */
function MegaPanel({ bg, eyebrow, tiles, cta, ctaLabel, asideTitle, tags, faqs, browseTo, browseLabel }: {
  bg: string; eyebrow: string; tiles: ReactNode; cta: string; ctaLabel: string;
  asideTitle: string; tags: [string, string][]; faqs: { label: string; slug: string }[]; browseTo: string; browseLabel: string;
}) {
  return (
    <div className="absolute left-1/2 top-full z-50 w-[min(64rem,94vw)] -translate-x-1/2 pt-2.5">
      <div className="flex gap-3 rounded-2xl border border-line bg-white p-3 shadow-float">
        <div
          className="flex min-w-0 flex-1 flex-col rounded-xl bg-cover bg-center p-5"
          style={{ backgroundImage: `url(${bg})`, backgroundColor: "var(--pp-primary-100)" }}
        >
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-[color:var(--pp-violet)]">{eyebrow}</p>
          <span className="mt-1 block font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            What would you like to do?
          </span>
          <div className="mt-3 grid grid-cols-2 gap-1.5">{tiles}</div>
          <div className="mt-4"><UnderlineLink to={cta}>{ctaLabel}</UnderlineLink></div>
        </div>
        <aside className="flex min-w-0 flex-1 flex-col gap-4 p-3">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">{asideTitle}</h2>
            <nav aria-label="Popular treatments" className="flex flex-wrap gap-1.5">
              {tags.map(([label, to]) => <Tag key={label} to={to}>{label}</Tag>)}
            </nav>
            <UnderlineLink to={browseTo}>{browseLabel}</UnderlineLink>
          </div>
          <div role="separator" className="h-px w-full bg-line" />
          <FaqList items={faqs} />
        </aside>
      </div>
    </div>
  );
}

/* ── user menu (signed-in) ─────────────────────────────── */
function UserMenu() {
  const { initials, displayName } = useUser();
  return (
    <ProfileMenu
      trigger={({ open, toggle, menuId }) => (
        <button
          type="button"
          id="user-menu-trigger"
          onClick={toggle}
          className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-3.5 text-base font-medium text-[color:var(--pp-primary-950)] hover:bg-[color:var(--state-hover)]"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          aria-label={`Account menu for ${displayName}`}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--pp-primary-950)] text-2xs text-white" aria-hidden>
            {initials}
          </span>
          <span className="hidden sm:inline">{displayName}</span>
          <Caret size={16} className="opacity-70" />
        </button>
      )}
    />
  );
}

/** Compact profile control used on the marketing homepage when signed in. */
function MarketingProfile() {
  return (
    <ProfileMenu
      menuId="marketing-user-menu"
      trigger={({ open, toggle, menuId }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex h-11 items-center gap-1.5 rounded-full px-2.5 text-base text-[color:var(--pp-nav-ink)] transition-colors duration-200 hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={open ? menuId : undefined}
          aria-label="Account menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.5 20c0-3.8 3.4-5.8 7.5-5.8s7.5 2 7.5 5.8" />
          </svg>
          <Chevron />
        </button>
      )}
    />
  );
}

/* Hoisted to module scope: declaring these inside SiteHeader would create a new
   component type each render, forcing React to remount the node and killing the
   CSS transition (the header appeared to blink rather than slide). */
function Shell({
  hidden,
  balanced,
  children,
}: {
  hidden: boolean;
  /** Three-column marketing layout: brand | nav | actions */
  balanced?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="sticky top-3 z-50 mt-3 px-4 will-change-transform sm:px-6 md:px-8 xl:px-20"
      style={{
        transform: hidden ? "translateY(calc(-100% - 1.5rem))" : "translateY(0)",
        opacity: hidden ? 0 : 1,
        transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
      }}
    >
      <div
        className={
          "mx-auto flex h-[3.75rem] w-full max-w-[105rem] items-center rounded-[1.25rem] " +
          "border border-[color:var(--neutral-200)]/80 bg-white/90 px-4 shadow-[0_10px_40px_rgba(24,7,48,0.06)] " +
          "backdrop-blur-xl backdrop-saturate-150 md:h-16 md:px-6 " +
          (balanced ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 md:gap-6" : "justify-between gap-4")
        }
      >
        {children}
      </div>
    </div>
  );
}

function Brand({ to }: { to: string }) {
  return (
    <LogoLink
      to={to}
      className="text-[color:var(--pp-primary-950)]"
      markClassName="h-7 w-7 md:h-8 md:w-8"
      wordClassName="text-md md:text-lg"
    />
  );
}

/* ── header ────────────────────────────────────────────── */
export type HeaderVariant = "marketing" | "app" | "focused" | "minimal";

/** Derive the right header for the current route + auth state. */
function useVariant(): HeaderVariant {
  const { pathname } = useLocation();
  const { signedIn } = useUser();
  if (pathname.startsWith("/care/") || pathname === "/fill" || pathname === "/transfer" || pathname === "/delivery-check") return "focused";
  if (pathname === "/login" || pathname === "/get-started") return "minimal";
  if (pathname.startsWith("/provider")) return "minimal";
  /* Homepage + How it works / Support — always marketing nav. */
  if (pathname === "/" || isAlwaysPublicPath(pathname)) return "marketing";
  /* Treatment / Pharmacy — marketing when logged out, app when logged in. */
  if (isDualBrowsePath(pathname) && !signedIn) return "marketing";
  return signedIn ? "app" : "marketing";
}

const ITEM =
  "group flex items-center gap-1 rounded-full px-3 py-2 text-base font-medium tracking-[0.01em] " +
  "text-[color:var(--pp-nav-ink)] transition-colors duration-200 " +
  "hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)]";

const CTA =
  "inline-flex h-11 items-center rounded-full bg-cta px-5 text-base font-medium text-white " +
  "transition-colors duration-200 hover:bg-cta-hover active:bg-cta-pressed";

const SEC = "#3FBFB5";
const PRI = "#7040D9";

function TreatmentMenu() {
  return (
    <MegaPanel
      bg={`${NAVCDN}/nav_bg_green.png`}
      eyebrow="Get Prescribed Online"
      tiles={<>
        <DropTile to="/appointments/treatments/weight-loss" icon="weight" label="Lose weight" chip={SEC} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/appointments/treatments/hair-loss" icon="hair" label="Reverse hair loss" chip={SEC} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/appointments/treatments/erectile-dysfunction" icon="ed" label="Male sexual health" chip={SEC} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/appointments/treatments/birth-control" icon="birth" label="Prevent pregnancy" chip={SEC} hover="hover:bg-[color:var(--state-hover)]" />
      </>}
      cta="/appointments" ctaLabel="Get a prescription"
      asideTitle="Virtual Care"
      tags={[["Find a doctor", "/doctors"], ["Acne (Mild)", "/appointments/treatments/acne"], ["Birth Control", "/appointments/treatments/birth-control"], ["Erectile Dysfunction", "/appointments/treatments/erectile-dysfunction"], ["Hair Loss", "/appointments/treatments/hair-loss"], ["Urinary Tract Infection", "/appointments/treatments/uti"], ["Weight Loss", "/appointments/treatments/weight-loss"], ["Minor ailments", "/appointments"]]}
      browseTo="/appointments" browseLabel="See all treatments"
      faqs={[
        { label: "Can I get a prescription online?", slug: "online-prescription" },
        { label: "How do I qualify for a prescription?", slug: "qualify-prescription" },
        { label: "How fast is the application process?", slug: "application-speed" },
        { label: "Is delivery free across Canada?", slug: "delivery-free" },
      ]}
    />
  );
}

function PharmacyMenu() {
  return (
    <MegaPanel
      bg={`${NAVCDN}/nav_bg_lilac.png`}
      eyebrow="Get Started"
      tiles={<>
        <DropTile to="/appointments" icon="plus" label="Get a new prescription" chip={PRI} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/fill" icon="searchprices" label="Fill a prescription" chip={PRI} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/transfer" icon="transfer" label="Transfer a prescription" chip={PRI} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/drug" icon="circle" label="Search prices" chip={PRI} hover="hover:bg-[color:var(--state-hover)]" />
        <DropTile to="/offers" icon="plus" label="Offers & discounts" chip={PRI} hover="hover:bg-[color:var(--state-hover)]" />
      </>}
      cta="/pharmacy" ctaLabel="Online Pharmacy"
      asideTitle="Explore Medications"
      tags={[["Ozempic", "/drug/ozempic"], ["Finasteride", "/drug/finasteride"], ["Minoxidil", "/drug/loniten"], ["Lantus", "/drug/lantus"], ["Wegovy", "/drug/wegovy"], ["Escitalopram", "/drug/escitalopram"], ["Jardiance", "/drug/jardiance"], ["Alysena", "/drug/alysena"]]}
      browseTo="/drug" browseLabel="Browse all medications"
      faqs={[
        { label: "I already have a prescription. How do I fill it with Pocketpills?", slug: "fill-existing-rx" },
        { label: "Can I get a prescription without consulting a doctor?", slug: "prescription-without-doctor" },
        { label: "How much does it cost?", slug: "how-much-cost" },
        { label: "How do I transfer my prescriptions from a different pharmacy?", slug: "transfer-prescription" },
      ]}
    />
  );
}

function SupportMenu() {
  return (
    <div className="absolute left-1/2 top-full z-50 w-[min(52rem,94vw)] -translate-x-1/2 pt-2.5">
      <div className="grid grid-cols-[minmax(10rem,0.9fr)_minmax(0,1.6fr)] gap-3 rounded-2xl border border-line bg-white p-3 shadow-float">
        <div className="flex flex-col gap-3 p-3">
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-[color:var(--pp-violet)]">Learn</p>
          <div className="flex flex-col gap-2.5">
            {[["About us", "/about-us"], ["How it works", "/how-it-works"], ["FAQs", "/questions"], ["Browse Ailments", "/consult/minor-ailments"]].map(([l, t]) =>
              <Link key={l} to={t} className="text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:text-[color:var(--pp-violet)]">{l}</Link>)}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 rounded-xl bg-[color:var(--pp-primary-100)] p-4">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-md font-medium text-[color:var(--pp-primary-950)]">Our Care Team</h2>
            <UnderlineLink to="/messages">Get in touch</UnderlineLink>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <Row label="Hours">
              <p className="leading-snug">Monday – Saturday<br />9:00 AM – 7:00 PM EST</p>
              <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-danger-subtle px-2 py-0.5 text-2xs font-semibold text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" />Closed Now
              </span>
            </Row>
            <Row label="Email"><a href="mailto:care@pocketpills.com" className="hover:text-[color:var(--pp-violet)]">care@pocketpills.com</a></Row>
            <Row label="Text"><a href="sms:18559507225" className="hover:text-[color:var(--pp-violet)]">1-855-950-7225</a></Row>
            <Row label="Fax"><span>1-855-950-7226</span></Row>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader({ variant: forced }: { variant?: HeaderVariant } = {}) {
  const derived = useVariant();
  const variant = forced ?? derived;
  const { pathname } = useLocation();
  const { signedIn } = useUser();
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  // Focused flows keep chrome pinned — losing "Save & exit" mid-checkout is hostile.
  const scrolledAway = useChromeVisibility();
  const hidden = variant === "focused" ? false : scrolledAway;

  /* Checkout / assessment flows — no nav, protect the funnel. */
  if (variant === "focused")
    return (
      <Shell hidden={hidden}>
        <Brand to="/app" />
        <Link to="/app" className="text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]">
          {t("nav.saveExit")}
        </Link>
      </Shell>
    );

  /* Auth — logo + help only. */
  if (variant === "minimal")
    return (
      <Shell hidden={hidden}>
        <Brand to="/" />
        <a href="tel:18559507226" className="text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)]">
          {t("nav.needHelp")}
        </a>
      </Shell>
    );

  const isApp = variant === "app";

  if (isApp) {
    return (
      <Shell hidden={hidden}>
        <Brand to="/app" />
        <div className="flex items-center gap-5 md:gap-6">
          <a
            href="https://apps.apple.com/ca/app/pocketpills-doctor-pharmacy/id1367442074"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 text-base font-medium text-[color:var(--pp-nav-ink)] transition-colors hover:text-[color:var(--pp-primary-950)] lg:inline-flex"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></svg>
            {t("nav.getApp")}
          </a>
          <Link to="/" className="hidden items-center gap-2 text-base font-medium text-[color:var(--pp-nav-ink)] transition-colors hover:text-[color:var(--pp-primary-950)] lg:inline-flex">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>
            Pocketpills.com
          </Link>
          <UserMenu />
        </div>
      </Shell>
    );
  }

  return (
    <Shell hidden={hidden} balanced>
      <div className="justify-self-start">
        <Brand to="/" />
      </div>

      <nav
        aria-label={t("nav.primary")}
        className="hidden items-center justify-center gap-0.5 md:flex"
        onMouseLeave={() => setOpen(null)}
      >
        <div className="relative" onMouseEnter={() => setOpen("t")}>
          <span className={ITEM}><Link to="/appointments">{t("nav.treatment")}</Link><Chevron /></span>
          {open === "t" && <TreatmentMenu />}
        </div>
        <div className="relative" onMouseEnter={() => setOpen("p")}>
          <span className={ITEM}><Link to="/drug">{t("nav.pharmacy")}</Link><Chevron /></span>
          {open === "p" && <PharmacyMenu />}
        </div>
        <Link
          to="/how-it-works"
          className={ITEM + (pathname === "/how-it-works" ? " bg-[color:var(--state-hover)] text-[color:var(--pp-primary-950)]" : "")}
        >
          {t("nav.howItWorks")}
        </Link>
        <div className="relative" onMouseEnter={() => setOpen("s")}>
          <span className={ITEM}><a href="#care">{t("nav.support")}</a><Chevron /></span>
          {open === "s" && <SupportMenu />}
        </div>
      </nav>

      <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-3">
        {signedIn ? (
          <>
            <MarketingProfile />
            <Link to="/dashboard" className={CTA}>
              {t("nav.dashboardCta")}
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden h-11 items-center gap-1.5 rounded-full px-3 text-base font-medium text-[color:var(--pp-nav-ink)] transition-colors hover:bg-[color:var(--state-hover)] hover:text-[color:var(--pp-primary-950)] sm:inline-flex"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-3.8 3.4-5.8 7.5-5.8s7.5 2 7.5 5.8" /></svg>
              {t("nav.logIn")}
            </Link>
            <Link to="/get-started" className={CTA}>
              {t("nav.join")}
            </Link>
          </>
        )}
      </div>
    </Shell>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-2">
      <div className="pt-0.5 text-2xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">{label}</div>
      <div className="min-w-0 text-ink-secondary">{children}</div>
    </div>
  );
}

