/** Icons from /icons/search — currentColor where possible for theming. */

type IconProps = { className?: string; title?: string };

export function SearchMagnifyIcon({ className = "h-5 w-5", title }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M14.854 14.8541L13.0415 13.0416M9.1665 14.1666C8.50989 14.1666 7.85971 14.0373 7.25309 13.786C6.64646 13.5348 6.09526 13.1665 5.63097 12.7022C5.16668 12.2379 4.79838 11.6867 4.54711 11.08C4.29583 10.4734 4.1665 9.82324 4.1665 9.16663C4.1665 8.51002 4.29583 7.85984 4.54711 7.25321C4.79838 6.64658 5.16668 6.09539 5.63097 5.63109C6.09526 5.1668 6.64646 4.7985 7.25309 4.54723C7.85971 4.29595 8.50989 4.16663 9.1665 4.16663C10.4926 4.16663 11.7644 4.69341 12.702 5.63109C13.6397 6.56877 14.1665 7.84054 14.1665 9.16663C14.1665 10.4927 13.6397 11.7645 12.702 12.7022C11.7644 13.6398 10.4926 14.1666 9.1665 14.1666Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchMicIcon({ className = "h-6 w-6", title }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M12 14C12.7956 14 13.5587 13.6839 14.1213 13.1213C14.6839 12.5587 15 11.7956 15 11V6C15 5.20435 14.6839 4.44129 14.1213 3.87868C13.5587 3.31607 12.7956 3 12 3C11.2044 3 10.4413 3.31607 9.87868 3.87868C9.31607 4.44129 9 5.20435 9 6V11C9 11.7956 9.31607 12.5587 9.87868 13.1213C10.4413 13.6839 11.2044 14 12 14Z"
        fill="currentColor"
      />
      <path
        d="M19 11C19 10.7348 18.8946 10.4804 18.7071 10.2929C18.5196 10.1054 18.2652 10 18 10C17.7348 10 17.4804 10.1054 17.2929 10.2929C17.1054 10.4804 17 10.7348 17 11C17 12.3261 16.4732 13.5979 15.5355 14.5355C14.5979 15.4732 13.3261 16 12 16C10.6739 16 9.40215 15.4732 8.46447 14.5355C7.52678 13.5979 7 12.3261 7 11C7 10.7348 6.89464 10.4804 6.70711 10.2929C6.51957 10.1054 6.26522 10 6 10C5.73478 10 5.48043 10.1054 5.29289 10.2929C5.10536 10.4804 5 10.7348 5 11C4.99957 12.6836 5.60592 14.3109 6.70791 15.5837C7.8099 16.8565 9.3337 17.6895 11 17.93V21C11 21.2652 11.1054 21.5196 11.2929 21.7071C11.4804 21.8946 11.7348 22 12 22C12.2652 22 12.5196 21.8946 12.7071 21.7071C12.8946 21.5196 13 21.2652 13 21V17.93C14.6663 17.6895 16.1901 16.8565 17.2921 15.5837C18.3941 14.3109 19.0004 12.6836 19 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchShieldIcon({ className = "h-4 w-4", title }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M10.5 1.875C10.6172 1.875 10.7637 1.9043 10.8809 1.96289L16.3887 4.30664C17.0332 4.59961 17.5312 5.21484 17.5312 5.97656C17.502 8.90625 16.3008 14.209 11.2617 16.6406C10.7637 16.875 10.207 16.875 9.70898 16.6406C4.66992 14.209 3.46875 8.90625 3.46875 5.97656C3.43945 5.21484 3.9375 4.59961 4.58203 4.30664L10.0898 1.96289C10.207 1.9043 10.3535 1.875 10.5 1.875ZM10.5 3.83789V14.9121C14.543 12.9492 15.627 8.64258 15.6562 6.03516L10.5 3.83789Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchDoctorIcon({ className = "h-5 w-5", title }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M3 3H5V6.88889C5 7.71401 5.31607 8.50533 5.87868 9.08878C6.44129 9.67222 7.20435 10 8 10C8.79565 10 9.55871 9.67222 10.1213 9.08878C10.6839 8.50533 11 7.71401 11 6.88889V3H13M16 12C17.1046 12 18 11.1046 18 10C18 8.89543 17.1046 8 16 8C14.8954 8 14 8.89543 14 10C14 11.1046 14.8954 12 16 12ZM16 12V13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13V10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchLocationIcon({ className = "h-5 w-5", title }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M10.134 18C10.134 18 4 14.5 4 9C4 7.4087 4.63214 5.88258 5.75736 4.75736C6.88258 3.63214 8.4087 3 10 3C11.5913 3 13.1174 3.63214 14.2426 4.75736C15.3679 5.88258 16 7.4087 16 9C16 14.5 10.134 18 10.134 18Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11.5C9.33696 11.5 8.70107 11.2366 8.23223 10.7678C7.76339 10.2989 7.5 9.66304 7.5 9C7.5 8.33696 7.76339 7.70107 8.23223 7.23223C8.70107 6.76339 9.33696 6.5 10 6.5C10.663 6.5 11.2989 6.76339 11.7678 7.23223C12.2366 7.70107 12.5 8.33696 12.5 9C12.5 9.66304 12.2366 10.2989 11.7678 10.7678C11.2989 11.2366 10.663 11.5 10 11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
